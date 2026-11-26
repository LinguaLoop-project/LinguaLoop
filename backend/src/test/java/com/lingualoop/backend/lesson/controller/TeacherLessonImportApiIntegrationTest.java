package com.lingualoop.backend.lesson.controller;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.wireMockConfig;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.RegisterExtension;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.github.tomakehurst.wiremock.junit5.WireMockExtension;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.ai.GeminiJsonClient;
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.lesson.ipa.IpaGenerator;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.support.TestData;
import com.lingualoop.backend.vocab.DeckManageTestData;

/**
 * UC-BH-03 Thêm bài học từ link YouTube, trên Postgres thật. YouTube Data API và TranscriptAPI dựng bằng WireMock;
 * espeak-ng (IPA) được thay bằng bản giả. Tạo bài không gọi Gemini.
 */
@SpringBootTest(properties = {
        "app.lesson-import.youtube-api-key=test-youtube-key-not-real",
        "app.lesson-import.transcript-api-key=test-transcript-key-not-real" })
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DeckManageTestData.class, LessonFixtures.class})
class TeacherLessonImportApiIntegrationTest {

    private static final String URL = "/api/v1/teacher/lessons/youtube";
    private static final String VIDEO_ID = "0zfEqGQFpw8";
    private static final String LINK = "https://www.youtube.com/watch?v=" + VIDEO_ID;

    @RegisterExtension
    static WireMockExtension youtube = WireMockExtension.newInstance()
            .options(wireMockConfig().dynamicPort()).build();

    @DynamicPropertySource
    static void youtubeUrl(DynamicPropertyRegistry registry) {
        registry.add("app.lesson-import.youtube-api-url", youtube::baseUrl);
        registry.add("app.lesson-import.transcript-api-url", youtube::baseUrl);
    }

    @Autowired private MockMvc mockMvc;
    @Autowired private DeckManageTestData users;
    @Autowired private LessonFixtures fixtures;
    @Autowired private JdbcTemplate jdbc;
    @MockitoBean private GeminiJsonClient gemini;
    @MockitoBean private IpaGenerator ipa;

    private final String suffix = UUID.randomUUID().toString().substring(0, 8);
    private UUID teacher;
    private UUID topic;

    @BeforeEach
    void setUp() {
        youtube.resetAll();
        // mọi test dùng chung một video; bài của test trước giữ video (BR-BH-18) nên xóa tạm trước mỗi test
        jdbc.update("UPDATE lessons SET deleted_at = now() WHERE youtube_id = ? AND deleted_at IS NULL", VIDEO_ID);
        teacher = users.teacher("GV " + suffix);
        topic = fixtures.topic("Du lịch " + suffix);
        TestData.setCredits(jdbc, teacher, 100);
        when(ipa.generate(anyList())).thenAnswer(inv -> ((List<?>) inv.getArgument(0)).stream()
                .map(text -> new IpaGenerator.SentenceIpa("ipa", "ipa-uk")).toList());
        speechOf(24);
    }

    // ------------------------------------------------------------------ dựng dữ liệu giả

    private void stubVideo(String title, String duration, String privacy, String live, String rating) {
        String item = """
                {"id":"%s","snippet":{"title":"%s","liveBroadcastContent":"%s"},
                 "contentDetails":{"duration":"%s","contentRating":{%s}},
                 "status":{"privacyStatus":"%s","uploadStatus":"processed"}}"""
                .formatted(VIDEO_ID, title, live, duration, rating == null ? "" : "\"ytRating\":\"" + rating + "\"",
                        privacy);
        stubVideos(200, "{\"items\":[" + item + "]}");
    }

    private void stubVideo(String title, String duration) {
        stubVideo(title, duration, "public", "none", null);
    }

    private void stubVideos(int status, String body) {
        youtube.stubFor(com.github.tomakehurst.wiremock.client.WireMock.get(urlPathEqualTo("/videos"))
                .willReturn(aResponse().withStatus(status).withHeader("Content-Type", "application/json")
                        .withBody(body)));
    }

    /** Phụ đề tiếng Anh có {@code count} dòng, dòng thứ i nói từ giây 10*i + 1 tới 10*i + 6, mỗi dòng là một câu. */
    private void speechOf(int count) {
        List<String> lines = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            lines.add("{\"text\":\"Sentence number %d.\",\"start\":%d,\"duration\":5}".formatted(i, 10 * i + 1));
        }
        transcript(200, """
                {"video_id":"%s","language":"en","transcript":[%s]}""".formatted(VIDEO_ID, String.join(",", lines)));
    }

    private int importLogs(String status, int costVnd) {
        return jdbc.queryForObject("SELECT count(*) FROM ai_usage_logs WHERE user_id = ? AND feature = 'lesson_import' "
                + "AND status = ? AND credits_charged = 0 AND cost_vnd = ?", Integer.class, teacher, status, costVnd);
    }

    private void transcript(int status, String body) {
        youtube.stubFor(com.github.tomakehurst.wiremock.client.WireMock.get(urlPathEqualTo("/youtube/transcript"))
                .willReturn(aResponse().withStatus(status).withHeader("Content-Type", "application/json")
                        .withBody(body)));
    }

    private ResultActions create(UUID user, Role role, String body) throws Exception {
        return mockMvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON).content(body)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + users.tokenFor(user, role)));
    }

    private ResultActions create(String body) throws Exception {
        return create(teacher, Role.TEACHER, body);
    }

    private String body(String link, String title, UUID topicId, String level) {
        return """
                {"youtubeUrl":%s,"title":%s,"topicId":%s,"cefrLevel":%s,"pro":false}"""
                .formatted(json(link), json(title), json(topicId == null ? null : topicId.toString()), json(level));
    }

    private static String json(String value) {
        return value == null ? "null" : "\"" + value + "\"";
    }

    private int lessonCount() {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM lessons WHERE owner_id = ?", Integer.class, teacher);
        return n == null ? 0 : n;
    }

    private int balance() {
        Integer n = jdbc.queryForObject("SELECT balance FROM ai_wallets WHERE user_id = ?", Integer.class, teacher);
        return n == null ? 0 : n;
    }

    // ------------------------------------------------------------------ luồng chính

    @Test
    void create_validVideo_savesDraftWithTimedSentencesAndIpaWithoutTranslation_AC_BH_14() throws Exception {
        stubVideo("How to Check In at the Airport", "PT8M");

        String response = create(body(LINK, "Airport English", topic, "B1"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value("Airport English"))
                .andExpect(jsonPath("$.data.status").value("draft"))
                .andExpect(jsonPath("$.data.youtubeId").value(VIDEO_ID))
                .andExpect(jsonPath("$.data.durationSec").value(480))
                .andExpect(jsonPath("$.data.sentenceCount").value(24))
                .andExpect(jsonPath("$.data.ipaCount").value(24))
                .andExpect(jsonPath("$.data.creditsCharged").value(10)) // BR-GA-06: hiện credit đã trừ và số dư
                .andExpect(jsonPath("$.data.creditBalance").value(90))
                .andReturn().getResponse().getContentAsString();

        UUID lessonId = UUID.fromString(com.jayway.jsonpath.JsonPath.read(response, "$.data.id"));
        Map<String, Object> lesson = jdbc.queryForMap(
                "SELECT owner_id, topic_id, status, kind, cefr_level, is_pro FROM lessons WHERE id = ?", lessonId);
        assertThat(lesson).containsEntry("owner_id", teacher).containsEntry("topic_id", topic)
                .containsEntry("status", "draft").containsEntry("kind", "library").containsEntry("cefr_level", "B1")
                .containsEntry("is_pro", false);
        List<Map<String, Object>> rows = jdbc.queryForList("SELECT text_en, text_vi, ipa_us, start_ms, end_ms "
                + "FROM sentences WHERE lesson_id = ? ORDER BY start_ms", lessonId);
        assertThat(rows).hasSize(24);
        assertThat(rows.get(0)).containsEntry("text_en", "Sentence number 0.").containsEntry("text_vi", null)
                .containsEntry("ipa_us", "ipa").containsEntry("start_ms", 1_000).containsEntry("end_ms", 6_000);
        assertThat(rows.get(23)).containsEntry("start_ms", 231_000).containsEntry("end_ms", 236_000);
        // Một mục Tạo cho bài kèm thông tin lúc tạo, không ghi riêng từng câu (BR-NK-18)
        Map<String, Object> created = jdbc.queryForMap("SELECT changes::text AS changes, note FROM audit_logs "
                + "WHERE target_id = ? AND action = 'create'", lessonId);
        assertThat(created.get("note")).isEqualTo("Tạo từ YouTube");
        assertThat(created.get("changes").toString()).contains("\"title\"", "Airport English", "\"cefrLevel\"",
                "\"sentenceCount\": {\"new\": 24, \"old\": null}");

        // tạo bài trừ 10 credit mỗi bài, một lần khi lưu Nháp (BR-BH-14)
        assertThat(balance()).isEqualTo(90);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM ai_usage_logs WHERE user_id = ? AND feature = 'lesson_import' "
                + "AND status = 'success' AND credits_charged = 10 AND cost_vnd = 131", Integer.class, teacher)).isEqualTo(1);
        // học viên chưa thấy bài Nháp
        assertThat(jdbc.queryForObject("SELECT count(*) FROM lessons WHERE id = ? AND status = 'published'",
                Integer.class, lessonId)).isZero();
        youtube.verify(getRequestedFor(urlPathEqualTo("/videos"))
                .withHeader("X-goog-api-key", equalTo("test-youtube-key-not-real"))
                .withQueryParam("id", equalTo(VIDEO_ID)));
    }

    @Test
    void create_blankTitle_usesVideoTitleCutTo100Characters_AC_BH_15() throws Exception {
        String longTitle = "How to Check In at the Airport " + "x".repeat(100);
        stubVideo(longTitle, "PT2M");

        create(body(LINK, "  ", topic, "A2"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.title").value(longTitle.substring(0, 100)));
    }

    // ------------------------------------------------------------------ luồng thay thế, ngoại lệ

    @Test
    void create_invalidOrBlankLink_rejectsWithoutCallingYouTube_AC_BH_16() throws Exception {
        create(body("https://example.com/abc", null, topic, "B1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("YOUTUBE_LINK_INVALID"));
        create(body("", null, topic, "B1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("youtubeUrl"));

        assertThat(lessonCount()).isZero();
        youtube.verify(0, getRequestedFor(urlPathEqualTo("/videos")));
    }

    @Test
    void create_videoWithoutEnglishSpeech_createsNothingAndChargesNothing_AC_BH_17() throws Exception {
        stubVideo("Instrumental", "PT3M");
        speechOf(0);

        create(body(LINK, null, topic, "B1"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("YOUTUBE_NO_ENGLISH_SPEECH"));

        assertThat(lessonCount()).isZero();
        assertThat(balance()).isEqualTo(100);
        // TranscriptAPI đã trả phụ đề (rỗng) nên đã tính phí: ghi chi phí, không trừ credit (BR-GA-12)
        assertThat(importLogs("failed", 131)).isEqualTo(1);
    }

    /** BR-GA-12: TranscriptAPI trả phụ đề ngôn ngữ khác (đã tính phí) thì ghi chi phí của lần lỗi, không trừ credit. */
    @Test
    void create_transcriptInAnotherLanguage_logsTheBilledCostWithoutCharging() throws Exception {
        stubVideo("Tin tức", "PT3M");
        transcript(200, """
                {"video_id":"%s","language":"vi","transcript":[{"text":"Xin chào.","start":1,"duration":3}]}"""
                .formatted(VIDEO_ID));

        create(body(LINK, null, topic, "B1")).andExpect(jsonPath("$.code").value("YOUTUBE_NO_ENGLISH_SPEECH"));

        assertThat(balance()).isEqualTo(100);
        assertThat(importLogs("failed", 131)).isEqualTo(1);
    }

    /** BR-GA-12: video không có phụ đề tiếng Anh (TranscriptAPI báo 404, không tính phí) thì không ghi chi phí. */
    @Test
    void create_videoWithoutCaptions_logsNoCost() throws Exception {
        stubVideo("Không phụ đề", "PT3M");
        transcript(404, "{\"detail\":\"No captions\",\"code\":\"no_captions\"}");

        create(body(LINK, null, topic, "B1")).andExpect(jsonPath("$.code").value("YOUTUBE_NO_ENGLISH_SPEECH"));

        assertThat(balance()).isEqualTo(100);
        assertThat(importLogs("failed", 131)).isZero();
    }

    @Test
    void create_privateRemovedLiveOrAgeRestrictedVideo_isUnavailable_AC_BH_18() throws Exception {
        stubVideos(200, "{\"items\":[]}"); // đã gỡ hoặc riêng tư
        create(body(LINK, null, topic, "B1")).andExpect(jsonPath("$.code").value("YOUTUBE_VIDEO_UNAVAILABLE"));

        stubVideo("Live", "P0D", "public", "live", null);
        create(body(LINK, null, topic, "B1")).andExpect(jsonPath("$.code").value("YOUTUBE_VIDEO_UNAVAILABLE"));

        stubVideo("18+", "PT3M", "public", "none", "ytAgeRestricted");
        create(body(LINK, null, topic, "B1"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("YOUTUBE_VIDEO_UNAVAILABLE"));

        assertThat(lessonCount()).isZero();
        assertThat(balance()).isEqualTo(100);
        verify(gemini, never()).generate(any());
    }

    @Test
    void create_unlistedVideo_isAccepted_BR_BH_07() throws Exception {
        stubVideo("Unlisted", "PT1M", "unlisted", "none", null);

        create(body(LINK, null, topic, "B1")).andExpect(status().isCreated());
    }

    @Test
    void create_videoLongerThan15Minutes_isRejected_AC_BH_19() throws Exception {
        stubVideo("Lecture", "PT16M");

        create(body(LINK, null, topic, "B1"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("YOUTUBE_VIDEO_TOO_LONG"))
                .andExpect(jsonPath("$.message").value("Video dài hơn giới hạn 15 phút"));

        assertThat(lessonCount()).isZero();
        verify(gemini, never()).generate(any());
    }

    @Test
    void create_titleTakenIgnoringCase_isRejected_AC_BH_20() throws Exception {
        jdbc.update("INSERT INTO lessons (owner_id, kind, topic_id, title, youtube_id, duration_sec, cefr_level) "
                + "VALUES (?, 'library', ?, 'Airport English', 'abcdefghijk', 60, 'B1')", teacher, topic);

        create(body(LINK, "airport english", topic, "B1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LESSON_TITLE_TAKEN"))
                .andExpect(jsonPath("$.message").value("Tiêu đề đã tồn tại"));

        assertThat(lessonCount()).isEqualTo(1);
        youtube.verify(0, getRequestedFor(urlPathEqualTo("/videos")));
    }

    @Test
    void create_missingTopicOrLevel_showsFieldError_AC_BH_21() throws Exception {
        create(body(LINK, null, null, "B1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("topicId"));
        create(body(LINK, null, topic, null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("cefrLevel"));
        create(body(LINK, null, UUID.randomUUID(), "B1"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("LESSON_TOPIC_NOT_FOUND"));

        assertThat(lessonCount()).isZero();
    }

    @Test
    void create_withoutEnoughCredit_createsNothingAndCallsNoService_AC_BH_102() throws Exception {
        TestData.setCredits(jdbc, teacher, 6); // ít hơn 10 credit mỗi bài
        stubVideo("Airport", "PT3M");

        create(body(LINK, null, topic, "B1"))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("QUOTA_EXCEEDED"))
                .andExpect(jsonPath("$.details.feature").value("lesson_import"))
                .andExpect(jsonPath("$.details.balance").value(6))
                .andExpect(jsonPath("$.details.cost").value(10));

        assertThat(lessonCount()).isZero();
        assertThat(balance()).isEqualTo(6);
        youtube.verify(0, getRequestedFor(urlPathEqualTo("/videos")));
    }

    @Test
    void create_youTubeDown_createsNothing_AC_BH_23() throws Exception {
        stubVideos(503, "{\"error\":{\"code\":503}}");

        create(body(LINK, "Airport English", topic, "B1"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("YOUTUBE_UNAVAILABLE"));

        assertThat(lessonCount()).isZero();
    }

    @Test
    void create_transcriptServiceFails_createsNothingAndChargesNothing_AC_BH_83() throws Exception {
        stubVideo("Airport", "PT3M");
        transcript(500, "{\"detail\":\"internal error\",\"code\":\"x\"}");

        create(body(LINK, null, topic, "B1"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("LESSON_TRANSCRIPT_UNAVAILABLE"));

        assertThat(lessonCount()).isZero();
        assertThat(balance()).isEqualTo(100);
    }

    // ------------------------------------------------------------------ BR-BH-18 mỗi video một bài

    private UUID existingLessonOn(UUID owner, String title) {
        return jdbc.queryForObject("INSERT INTO lessons (owner_id, kind, topic_id, title, youtube_id, duration_sec, "
                + "cefr_level, status) VALUES (?, 'library', ?, ?, ?, 300, 'B1', 'draft') RETURNING id", UUID.class,
                owner, topic, title, VIDEO_ID);
    }

    @Test
    void create_videoAlreadyUsedByOwnLesson_pointsToThatLesson_AC_BH_93() throws Exception {
        UUID existing = existingLessonOn(teacher, "Airport English");

        create(body(LINK, "Airport English 2", topic, "B1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LESSON_VIDEO_TAKEN"))
                .andExpect(jsonPath("$.details.lessonId").value(existing.toString()))
                .andExpect(jsonPath("$.details.title").value("Airport English"));

        assertThat(lessonCount()).isEqualTo(1);
        assertThat(balance()).isEqualTo(100);
        verify(gemini, never()).generate(any());
        youtube.verify(0, getRequestedFor(urlPathEqualTo("/videos")));
    }

    @Test
    void create_videoAlreadyUsedByAnotherTeacher_hidesThatLesson_AC_BH_94() throws Exception {
        existingLessonOn(users.teacher("GV B " + suffix), "Check-in Tips");

        create(body(LINK, "Airport English", topic, "B1"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LESSON_VIDEO_TAKEN"))
                .andExpect(jsonPath("$.details.lessonId").doesNotExist())
                .andExpect(jsonPath("$.details.title").doesNotExist());

        assertThat(lessonCount()).isZero();
        verify(gemini, never()).generate(any());
    }

    @Test
    void create_byAdmin_isForbidden_BR_BH_02() throws Exception {
        create(users.admin(), Role.ADMIN, body(LINK, null, topic, "B1"))
                .andExpect(status().isForbidden());
    }

    // ------------------------------------------------------------------ xem trước video (Bước 3)

    private ResultActions preview(String link) throws Exception {
        return mockMvc.perform(get(URL + "/preview").param("url", link)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + users.tokenFor(teacher, Role.TEACHER)));
    }

    @Test
    void preview_validVideo_returnsTitleAndDurationWithoutAiOrSaving_UC_BH_03() throws Exception {
        stubVideo("Airport English", "PT4M30S");

        preview(LINK)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.youtubeId").value(VIDEO_ID))
                .andExpect(jsonPath("$.data.title").value("Airport English"))
                .andExpect(jsonPath("$.data.durationSec").value(270));

        assertThat(lessonCount()).isZero();
        assertThat(balance()).isEqualTo(100);
        verify(gemini, never()).generate(any());
    }

    @Test
    void preview_invalidLinkTooLongOrTakenVideo_reportsSameErrorsAsCreate_AC_BH_16_19_93() throws Exception {
        preview("https://example.com/watch?v=" + VIDEO_ID)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("YOUTUBE_LINK_INVALID"));

        stubVideo("Lecture", "PT16M");
        preview(LINK).andExpect(jsonPath("$.code").value("YOUTUBE_VIDEO_TOO_LONG"));

        UUID existing = existingLessonOn(teacher, "Airport English");
        preview(LINK)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LESSON_VIDEO_TAKEN"))
                .andExpect(jsonPath("$.details.lessonId").value(existing.toString()));
    }
}
