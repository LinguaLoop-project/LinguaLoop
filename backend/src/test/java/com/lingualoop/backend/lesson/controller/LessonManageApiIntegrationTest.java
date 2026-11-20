package com.lingualoop.backend.lesson.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.ai.GeminiJsonClient;
import com.lingualoop.backend.ai.GeminiJsonClient.Result;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.lesson.ipa.IpaGenerator;
import com.lingualoop.backend.lesson.ipa.IpaGenerator.SentenceIpa;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.support.TestData;
import com.lingualoop.backend.vocab.DeckManageTestData;

/**
 * UC-BH-01, 02, 04 đến 10: quản lý bài học của giáo viên và quản trị viên, trên Postgres thật. Gemini (gợi ý dịch) và
 * espeak-ng (IPA) được thay bằng bản giả.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DeckManageTestData.class, LessonFixtures.class})
class LessonManageApiIntegrationTest {

    private static final String TEACHER_URL = "/api/v1/teacher/lessons";
    private static final String ADMIN_URL = "/api/v1/admin/lessons";

    @Autowired private MockMvc mockMvc;
    @Autowired private DeckManageTestData users;
    @Autowired private LessonFixtures fixtures;
    @Autowired private JdbcTemplate jdbc;
    @MockitoBean private GeminiJsonClient gemini;
    @MockitoBean private IpaGenerator ipa;

    private final String suffix = UUID.randomUUID().toString().substring(0, 8);
    private UUID teacherA;
    private UUID teacherB;
    private UUID admin;
    private UUID topic;
    private UUID otherTopic;

    @BeforeEach
    void setUp() {
        teacherA = users.teacher("GV A " + suffix);
        teacherB = users.teacher("GV B " + suffix);
        admin = users.admin();
        topic = fixtures.topic("Du lịch " + suffix);
        otherTopic = fixtures.topic("Công sở " + suffix);
        TestData.setCredits(jdbc, teacherA, 100);
        when(ipa.generate(anyList())).thenAnswer(inv -> ((List<?>) inv.getArgument(0)).stream()
                .map(text -> new SentenceIpa("ipa-us", "ipa-uk")).toList());
    }

    // ------------------------------------------------------------------ dữ liệu mẫu

    private UUID lesson(UUID owner, String title, String status) {
        return lesson(owner, title, status, topic, "B1", false, null, randomVideo());
    }

    private UUID lesson(UUID owner, String title, String status, UUID topicId, String level, boolean pro,
            Instant deletedAt, String youtubeId) {
        return jdbc.queryForObject("INSERT INTO lessons (owner_id, kind, topic_id, title, youtube_id, duration_sec, "
                + "cefr_level, is_pro, status, deleted_at) VALUES (?, 'library', ?, ?, ?, 600, ?, ?, ?, ?) RETURNING id",
                UUID.class, owner, topicId, title, youtubeId, level, pro, status,
                deletedAt == null ? null : Timestamp.from(deletedAt));
    }

    private static String randomVideo() {
        return UUID.randomUUID().toString().replace("-", "").substring(0, 11);
    }

    /** {@code count} câu, câu thứ i (từ 0) bắt đầu ở giây i; mọi câu có bản dịch trừ các vị trí (từ 1) trong {@code noVi}. */
    private List<UUID> sentences(UUID lessonId, int count, int... noVi) {
        List<Integer> missing = java.util.Arrays.stream(noVi).boxed().toList();
        return java.util.stream.IntStream.range(0, count)
                .mapToObj(i -> fixtures.sentence(lessonId, i, "Sentence " + i,
                        missing.contains(i + 1) ? null : "Câu " + i))
                .toList();
    }

    private ResultActions call(MockHttpServletRequestBuilder request, UUID user, Role role) throws Exception {
        return mockMvc.perform(request.contentType(MediaType.APPLICATION_JSON)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + users.tokenFor(user, role)));
    }

    private ResultActions asA(MockHttpServletRequestBuilder request) throws Exception {
        return call(request, teacherA, Role.TEACHER);
    }

    private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
        return call(request, admin, Role.ADMIN);
    }

    private String statusOf(UUID lessonId) {
        return jdbc.queryForObject("SELECT status FROM lessons WHERE id = ?", String.class, lessonId);
    }

    private Instant deletedAt(UUID lessonId) {
        Timestamp at = jdbc.queryForObject("SELECT deleted_at FROM lessons WHERE id = ?", Timestamp.class, lessonId);
        return at == null ? null : at.toInstant();
    }

    private int auditCount(UUID targetId, String action) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM audit_logs WHERE target_id = ? AND action = ?",
                Integer.class, targetId, action);
        return n == null ? 0 : n;
    }

    private int balance(UUID user) {
        Integer n = jdbc.queryForObject("SELECT balance FROM ai_wallets WHERE user_id = ?", Integer.class, user);
        return n == null ? 0 : n;
    }

    // ------------------------------------------------------------------ UC-BH-01 danh sách

    @Test
    void teacherList_showsOnlyOwnNotDeletedLessons_AC_BH_01() throws Exception {
        UUID draft = lesson(teacherA, "Draft " + suffix, "draft");
        sentences(draft, 2);
        lesson(teacherA, "Pub1 " + suffix, "published");
        lesson(teacherA, "Pub2 " + suffix, "published");
        lesson(teacherA, "Gone " + suffix, "draft", topic, "B1", false, Instant.now(), randomVideo());
        lesson(teacherB, "B1 " + suffix, "published");

        asA(get(TEACHER_URL))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.items[?(@.id == '%s')].sentenceCount".formatted(draft)).value(2))
                .andExpect(jsonPath("$.data.items[?(@.id == '%s')].status".formatted(draft)).value("draft"))
                .andExpect(jsonPath("$.data.items[?(@.id == '%s')].topicName".formatted(draft))
                        .value("Du lịch " + suffix))
                .andExpect(jsonPath("$.data.items[0].thumbnailUrl").isNotEmpty());
    }

    @Test
    void adminList_showsOnlyPublishedWithOwnerName_AC_BH_02_AC_BH_82() throws Exception {
        lesson(teacherA, "Draft " + suffix, "draft");
        UUID a1 = lesson(teacherA, "A1 " + suffix, "published");
        lesson(teacherA, "A2 " + suffix, "published");
        lesson(teacherB, "B " + suffix, "published");

        asAdmin(get(ADMIN_URL).param("q", suffix))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.size").value(10))
                .andExpect(jsonPath("$.data.items[?(@.id == '%s')].ownerName".formatted(a1))
                        .value("GV A " + suffix));
        asAdmin(get(ADMIN_URL).param("ownerId", teacherA.toString()))
                .andExpect(jsonPath("$.data.totalElements").value(2));
        asAdmin(get(ADMIN_URL).param("status", "draft"))
                .andExpect(status().isForbidden());
    }

    @Test
    void teacherList_searchAndFilters_AC_BH_03() throws Exception {
        UUID match = lesson(teacherA, "Travel Basics", "draft", topic, "B1", true, null, randomVideo());
        lesson(teacherA, "Travel Free", "draft", topic, "B1", false, null, randomVideo());
        lesson(teacherA, "Travel Office", "draft", otherTopic, "B1", true, null, randomVideo());
        lesson(teacherA, "Travel A2", "draft", topic, "A2", true, null, randomVideo());
        lesson(teacherA, "Travel Live", "published", topic, "B1", true, null, randomVideo());

        asA(get(TEACHER_URL).param("q", "TRAVEL").param("topicId", topic.toString()).param("cefrLevel", "B1")
                .param("status", "draft").param("pro", "true"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(match.toString()));
    }

    @Test
    void teacherList_deletedFilterShowsOnlyLast30Days_AC_BH_04() throws Exception {
        UUID recent = lesson(teacherA, "Recent", "draft", topic, "B1", false,
                Instant.now().minus(Duration.ofDays(5)), randomVideo());
        lesson(teacherA, "Old", "draft", topic, "B1", false, Instant.now().minus(Duration.ofDays(40)), randomVideo());
        lesson(teacherA, "Alive", "draft");

        asA(get(TEACHER_URL).param("status", "deleted"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(recent.toString()))
                .andExpect(jsonPath("$.data.items[0].deletedAt").isNotEmpty());
    }

    @Test
    void teacherList_empty_AC_BH_05() throws Exception {
        asA(get(TEACHER_URL)).andExpect(jsonPath("$.data.totalElements").value(0));
    }

    // ------------------------------------------------------------------ UC-BH-02 chi tiết

    @Test
    void teacherDetail_ownDraftWithOrderedSentences_AC_BH_07() throws Exception {
        UUID id = lesson(teacherA, "Airport English", "draft");
        sentences(id, 3);

        asA(get(TEACHER_URL + "/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("draft"))
                .andExpect(jsonPath("$.data.youtubeUrl").isNotEmpty())
                .andExpect(jsonPath("$.data.sentences.length()").value(3))
                .andExpect(jsonPath("$.data.sentences[0].position").value(1))
                .andExpect(jsonPath("$.data.sentences[0].startMs").value(0))
                .andExpect(jsonPath("$.data.sentences[2].textEn").value("Sentence 2"))
                .andExpect(jsonPath("$.data.sentences[2].textVi").value("Câu 2"));
    }

    @Test
    void detail_permissions_AC_BH_08_09_10_11() throws Exception {
        UUID published = lesson(teacherA, "Pub", "published");
        UUID draft = lesson(teacherA, "Draft", "draft");
        UUID deleted = lesson(teacherA, "Gone", "draft", topic, "B1", false, Instant.now(), randomVideo());

        asAdmin(get(ADMIN_URL + "/" + published))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.ownerName").value("GV A " + suffix));
        call(get(TEACHER_URL + "/" + published), teacherB, Role.TEACHER).andExpect(status().isForbidden());
        asAdmin(get(ADMIN_URL + "/" + draft)).andExpect(status().isForbidden());
        asA(get(TEACHER_URL + "/" + deleted))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("LESSON_NOT_FOUND"));
    }

    // ------------------------------------------------------------------ UC-BH-04 sửa thông tin

    @Test
    void updateInfo_savesAndAudits_AC_BH_24() throws Exception {
        UUID id = lesson(teacherA, "Airport English", "draft");

        asA(put(TEACHER_URL + "/" + id).content("""
                {"title":"Airport English 1","topicId":"%s","cefrLevel":"A2","pro":false}""".formatted(topic)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("Airport English 1"))
                .andExpect(jsonPath("$.data.cefrLevel").value("A2"));

        assertThat(auditCount(id, "update")).isEqualTo(1);
        String changes = jdbc.queryForObject("SELECT changes::text FROM audit_logs WHERE target_id = ?", String.class,
                id);
        assertThat(changes).contains("Airport English 1").contains("\"old\": \"B1\"");
    }

    @Test
    void updateInfo_titleTakenOrInvalid_AC_BH_28_29() throws Exception {
        lesson(teacherA, "Airport English", "draft");
        UUID hotel = lesson(teacherA, "Hotel English", "draft");
        String body = """
                {"title":"%s","topicId":"%s","cefrLevel":"B1","pro":false}""";

        asA(put(TEACHER_URL + "/" + hotel).content(body.formatted("airport english", topic)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LESSON_TITLE_TAKEN"));
        asA(put(TEACHER_URL + "/" + hotel).content(body.formatted("  ", topic)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("title"));
        asA(put(TEACHER_URL + "/" + hotel).content(body.formatted("x".repeat(101), topic)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("title"));
        assertThat(jdbc.queryForObject("SELECT title FROM lessons WHERE id = ?", String.class, hotel))
                .isEqualTo("Hotel English");
    }

    @Test
    void updateInfo_otherTeacherOrDeleted_AC_BH_30_31() throws Exception {
        UUID ofB = lesson(teacherB, "B", "draft");
        UUID deleted = lesson(teacherA, "Gone", "draft", topic, "B1", false, Instant.now(), randomVideo());
        String body = """
                {"title":"X","topicId":"%s","cefrLevel":"B1","pro":false}""".formatted(topic);

        asA(put(TEACHER_URL + "/" + ofB).content(body)).andExpect(status().isForbidden());
        asA(put(TEACHER_URL + "/" + deleted).content(body)).andExpect(status().isNotFound());
    }

    // ------------------------------------------------------------------ UC-BH-05 sửa câu

    @Test
    void updateSentences_savesTranslationAndIpaWithAudit_AC_BH_34_35_36() throws Exception {
        UUID id = lesson(teacherA, "L", "draft");
        List<UUID> s = sentences(id, 3);

        asA(put(TEACHER_URL + "/" + id + "/sentences").content("""
                {"sentences":[{"id":"%s","textEn":"Sentence 1","ipaUs":"new ipa","textVi":"Bản dịch mới",
                  "startMs":1000,"endMs":1600}]}""".formatted(s.get(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sentences[1].textVi").value("Bản dịch mới"))
                .andExpect(jsonPath("$.data.sentences[1].ipaUs").value("new ipa"))
                .andExpect(jsonPath("$.data.sentences[1].endMs").value(1600))
                .andExpect(jsonPath("$.data.sentences[0].textVi").value("Câu 0"));

        String changes = jdbc.queryForObject(
                "SELECT changes::text FROM audit_logs WHERE target_id = ? AND action = 'update'", String.class,
                s.get(1));
        assertThat(changes).contains("Câu 1").contains("Bản dịch mới");
    }

    @Test
    void updateSentences_invalidTimesOrText_rejectsAll_AC_BH_37_38() throws Exception {
        UUID id = lesson(teacherA, "L", "draft");
        List<UUID> s = sentences(id, 3);
        String one = """
                {"sentences":[{"id":"%s","textEn":"%s","textVi":"vi","startMs":%d,"endMs":%d}]}""";

        // chồng lấn câu kế tiếp (bắt đầu ở 2000)
        asA(put(TEACHER_URL + "/" + id + "/sentences").content(one.formatted(s.get(1), "x", 1000, 2500)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("LESSON_SENTENCES_INVALID"))
                .andExpect(jsonPath("$.details.errors[0].code").value("Overlap"));
        // ngắn hơn 0,5 giây
        asA(put(TEACHER_URL + "/" + id + "/sentences").content(one.formatted(s.get(1), "x", 1000, 1400)))
                .andExpect(jsonPath("$.details.errors[0].code").value("MinDuration"));
        // bắt đầu không nhỏ hơn kết thúc
        asA(put(TEACHER_URL + "/" + id + "/sentences").content(one.formatted(s.get(1), "x", 1500, 1500)))
                .andExpect(jsonPath("$.details.errors[0].code").value("StartBeforeEnd"));
        // vượt độ dài video 600 giây
        asA(put(TEACHER_URL + "/" + id + "/sentences").content(one.formatted(s.get(2), "x", 599_800, 600_400)))
                .andExpect(jsonPath("$.details.errors[0].code").value("ExceedsVideo"));
        // câu tiếng Anh trống
        asA(put(TEACHER_URL + "/" + id + "/sentences").content(one.formatted(s.get(1), " ", 1000, 1900)))
                .andExpect(jsonPath("$.details.errors[0].field").value("textEn"))
                .andExpect(jsonPath("$.details.errors[0].code").value("NotBlank"));
        // bản dịch 501 ký tự
        asA(put(TEACHER_URL + "/" + id + "/sentences").content("""
                {"sentences":[{"id":"%s","textEn":"x","textVi":"%s","startMs":1000,"endMs":1900}]}"""
                .formatted(s.get(1), "v".repeat(501))))
                .andExpect(jsonPath("$.details.errors[0].field").value("textVi"));

        assertThat(jdbc.queryForObject("SELECT text_en FROM sentences WHERE id = ?", String.class, s.get(1)))
                .isEqualTo("Sentence 1");
    }

    @Test
    void updateSentences_deleteRenumbers_AC_BH_39() throws Exception {
        UUID id = lesson(teacherA, "L", "draft");
        List<UUID> s = sentences(id, 3);

        asA(put(TEACHER_URL + "/" + id + "/sentences").content("""
                {"deletedIds":["%s"]}""".formatted(s.get(0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sentenceCount").value(2))
                .andExpect(jsonPath("$.data.sentences[0].position").value(1))
                .andExpect(jsonPath("$.data.sentences[0].id").value(s.get(1).toString()));
        assertThat(jdbc.queryForObject("SELECT deleted_at IS NOT NULL FROM sentences WHERE id = ?", Boolean.class,
                s.get(0))).isTrue();
    }

    @Test
    void updateSentences_publishedMustKeepOneSentence_AC_BH_40() throws Exception {
        UUID id = lesson(teacherA, "L", "published");
        List<UUID> s = sentences(id, 1);

        asA(put(TEACHER_URL + "/" + id + "/sentences").content("""
                {"deletedIds":["%s"]}""".formatted(s.get(0))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LESSON_MUST_KEEP_SENTENCE"));
    }

    @Test
    void updateSentences_publishedKeepsAttempts_AC_BH_41() throws Exception {
        UUID id = lesson(teacherA, "L", "published");
        List<UUID> s = sentences(id, 2);

        asA(put(TEACHER_URL + "/" + id + "/sentences").content("""
                {"sentences":[{"id":"%s","textEn":"Sentence 0","textVi":"Mới","startMs":0,"endMs":900}]}"""
                .formatted(s.get(0))))
                .andExpect(status().isOk());
        // câu được sửa tại chỗ, không đổi mã nên lượt làm của học viên vẫn gắn với câu
        assertThat(jdbc.queryForObject("SELECT text_vi FROM sentences WHERE id = ?", String.class, s.get(0)))
                .isEqualTo("Mới");
        assertThat(statusOf(id)).isEqualTo("published");
    }

    @Test
    void updateSentences_otherTeacherOrDeletedLesson_AC_BH_42_86() throws Exception {
        UUID ofB = lesson(teacherB, "B", "draft");
        UUID deleted = lesson(teacherA, "Gone", "draft", topic, "B1", false, Instant.now(), randomVideo());

        asA(put(TEACHER_URL + "/" + ofB + "/sentences").content("{}")).andExpect(status().isForbidden());
        asA(put(TEACHER_URL + "/" + deleted + "/sentences").content("{}")).andExpect(status().isNotFound());
    }

    @Test
    void split_neverPublishedDraft_addsSentenceAndFillsIpa_AC_BH_98() throws Exception {
        UUID id = lesson(teacherA, "L", "draft");
        List<UUID> s = sentences(id, 2);

        asA(put(TEACHER_URL + "/" + id + "/sentences").content("""
                {"sentences":[{"id":"%s","textEn":"Sentence","textVi":"Câu 0","startMs":0,"endMs":500}],
                 "added":[{"key":"new-1","textEn":"zero","startMs":500,"endMs":1000}]}""".formatted(s.get(0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sentenceCount").value(3))
                .andExpect(jsonPath("$.data.sentences[0].textEn").value("Sentence"))
                .andExpect(jsonPath("$.data.sentences[0].ipaUs").value("ipa-us"))
                .andExpect(jsonPath("$.data.sentences[1].textEn").value("zero"))
                .andExpect(jsonPath("$.data.sentences[1].startMs").value(500))
                .andExpect(jsonPath("$.data.sentences[1].ipaUs").value("ipa-us"))
                .andExpect(jsonPath("$.data.sentences[1].textVi").doesNotExist())
                .andExpect(jsonPath("$.data.sentences[2].id").value(s.get(1).toString()))
                .andExpect(jsonPath("$.data.structureLocked").value(false));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM audit_logs WHERE action = 'create' "
                + "AND target_type = 'sentence' AND target_name = 'zero'", Integer.class)).isEqualTo(1);
    }

    @Test
    void merge_twoSentences_keepsFirstIdAndDeletesSecond_AC_BH_99() throws Exception {
        UUID id = lesson(teacherA, "L", "draft");
        List<UUID> s = sentences(id, 3);

        asA(put(TEACHER_URL + "/" + id + "/sentences").content("""
                {"sentences":[{"id":"%s","textEn":"Sentence 0 Sentence 1","textVi":"Câu 0 Câu 1",
                  "startMs":0,"endMs":1900}],"deletedIds":["%s"]}""".formatted(s.get(0), s.get(1))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sentenceCount").value(2))
                .andExpect(jsonPath("$.data.sentences[0].id").value(s.get(0).toString()))
                .andExpect(jsonPath("$.data.sentences[0].endMs").value(1900))
                .andExpect(jsonPath("$.data.sentences[0].ipaUs").value("ipa-us"))
                .andExpect(jsonPath("$.data.sentences[1].id").value(s.get(2).toString()));
    }

    @Test
    void split_lessonPublishedBefore_isLockedEvenAfterUnpublish_AC_BH_100() throws Exception {
        UUID id = lesson(teacherA, "L", "draft");
        List<UUID> s = sentences(id, 2);
        asA(post(TEACHER_URL + "/" + id + "/publish")).andExpect(status().isNoContent());
        asA(post(TEACHER_URL + "/" + id + "/unpublish")).andExpect(status().isNoContent());

        asA(get(TEACHER_URL + "/" + id)).andExpect(jsonPath("$.data.structureLocked").value(true));
        asA(put(TEACHER_URL + "/" + id + "/sentences").content("""
                {"sentences":[{"id":"%s","textEn":"Sentence","textVi":"Câu 0","startMs":0,"endMs":500}],
                 "added":[{"key":"new-1","textEn":"zero","startMs":500,"endMs":1000}]}""".formatted(s.get(0))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LESSON_STRUCTURE_LOCKED"));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM sentences WHERE lesson_id = ? AND deleted_at IS NULL",
                Integer.class, id)).isEqualTo(2);
    }

    @Test
    void split_newSentenceWithoutSplitTime_reportsErrorOnItsKey_AC_BH_101() throws Exception {
        UUID id = lesson(teacherA, "L", "draft");
        List<UUID> s = sentences(id, 2);

        asA(put(TEACHER_URL + "/" + id + "/sentences").content("""
                {"sentences":[{"id":"%s","textEn":"Sentence","textVi":"Câu 0","startMs":0,"endMs":null}],
                 "added":[{"key":"new-1","textEn":"zero","startMs":null,"endMs":900}]}""".formatted(s.get(0))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("LESSON_SENTENCES_INVALID"))
                .andExpect(jsonPath("$.details.errors[?(@.sentenceId == '%s')].field".formatted(s.get(0)))
                        .value("endMs"))
                .andExpect(jsonPath("$.details.errors[?(@.sentenceId == 'new-1')].field").value("startMs"));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM sentences WHERE lesson_id = ?", Integer.class, id))
                .isEqualTo(2);
    }

    @Test
    void publish_setsFirstPublishedAtOnce() throws Exception {
        UUID id = lesson(teacherA, "L", "draft");
        sentences(id, 1);
        asA(post(TEACHER_URL + "/" + id + "/publish")).andExpect(status().isNoContent());
        Timestamp first = jdbc.queryForObject("SELECT first_published_at FROM lessons WHERE id = ?", Timestamp.class, id);
        asA(post(TEACHER_URL + "/" + id + "/unpublish")).andExpect(status().isNoContent());
        asA(post(TEACHER_URL + "/" + id + "/publish")).andExpect(status().isNoContent());

        assertThat(first).isNotNull();
        assertThat(jdbc.queryForObject("SELECT first_published_at FROM lessons WHERE id = ?", Timestamp.class, id))
                .isEqualTo(first);
    }

    // ------------------------------------------------------------------ UC-BH-06 xuất bản

    @Test
    void publish_completeDraft_publishesAndAudits_AC_BH_43() throws Exception {
        UUID id = lesson(teacherA, "L", "draft");
        sentences(id, 3);

        asA(post(TEACHER_URL + "/" + id + "/publish")).andExpect(status().isNoContent());

        assertThat(statusOf(id)).isEqualTo("published");
        assertThat(auditCount(id, "publish")).isEqualTo(1);
    }

    @Test
    void publish_missingTranslationsOrNoSentences_AC_BH_45_46() throws Exception {
        UUID missing = lesson(teacherA, "Missing", "draft");
        sentences(missing, 9, 7, 8);
        UUID empty = lesson(teacherA, "Empty", "draft");

        asA(post(TEACHER_URL + "/" + missing + "/publish"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("LESSON_NOT_PUBLISHABLE"))
                .andExpect(jsonPath("$.details.missingTranslation[0]").value(7))
                .andExpect(jsonPath("$.details.missingTranslation[1]").value(8));
        asA(post(TEACHER_URL + "/" + empty + "/publish"))
                .andExpect(jsonPath("$.details.noSentences").value(true));
        assertThat(statusOf(missing)).isEqualTo("draft");
    }

    @Test
    void publish_otherTeacherOrAlreadyPublished_AC_BH_47_89() throws Exception {
        UUID ofB = lesson(teacherB, "B", "draft");
        sentences(ofB, 1);
        UUID published = lesson(teacherA, "Pub", "published");

        asA(post(TEACHER_URL + "/" + ofB + "/publish")).andExpect(status().isForbidden());
        asA(post(TEACHER_URL + "/" + published + "/publish"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LESSON_ALREADY_PUBLISHED"));
        assertThat(statusOf(ofB)).isEqualTo("draft");
    }

    // ------------------------------------------------------------------ UC-BH-07 gỡ xuất bản

    @Test
    void teacherUnpublish_backToDraftWithoutReason_AC_BH_50() throws Exception {
        UUID id = lesson(teacherA, "L", "published");

        asA(post(TEACHER_URL + "/" + id + "/unpublish")).andExpect(status().isNoContent());

        assertThat(statusOf(id)).isEqualTo("draft");
        assertThat(auditCount(id, "unpublish")).isEqualTo(1);
    }

    @Test
    void adminUnpublish_reasonShownToTeacher_AC_BH_51() throws Exception {
        UUID id = lesson(teacherA, "L", "published");

        asAdmin(post(ADMIN_URL + "/" + id + "/unpublish").content("""
                {"reason":"Video vi phạm bản quyền"}""")).andExpect(status().isNoContent());

        asA(get(TEACHER_URL))
                .andExpect(jsonPath("$.data.items[0].status").value("draft"))
                .andExpect(jsonPath("$.data.items[0].unpublishReason").value("Video vi phạm bản quyền"));
        assertThat(jdbc.queryForObject("SELECT note FROM audit_logs WHERE target_id = ? AND action = 'unpublish'",
                String.class, id)).isEqualTo("Video vi phạm bản quyền");
    }

    @Test
    void unpublish_otherTeacherDraftOrBadReason_AC_BH_52_53_54() throws Exception {
        UUID ofB = lesson(teacherB, "B", "published");
        UUID draft = lesson(teacherA, "Draft", "draft");

        asA(post(TEACHER_URL + "/" + ofB + "/unpublish")).andExpect(status().isForbidden());
        asA(post(TEACHER_URL + "/" + draft + "/unpublish"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LESSON_NOT_PUBLISHED"));
        asAdmin(post(ADMIN_URL + "/" + ofB + "/unpublish").content("{\"reason\":\"  \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("reason"));
        asAdmin(post(ADMIN_URL + "/" + ofB + "/unpublish").content("{\"reason\":\"%s\"}".formatted("r".repeat(501))))
                .andExpect(status().isBadRequest());
        assertThat(statusOf(ofB)).isEqualTo("published");
    }

    // ------------------------------------------------------------------ UC-BH-08 xóa

    @Test
    void delete_movesToDeletedFilterAndAudits_AC_BH_57_58() throws Exception {
        UUID id = lesson(teacherA, "Airport English", "published");

        asA(delete(TEACHER_URL + "/" + id)).andExpect(status().isNoContent());

        asA(get(TEACHER_URL)).andExpect(jsonPath("$.data.totalElements").value(0));
        asA(get(TEACHER_URL).param("status", "deleted"))
                .andExpect(jsonPath("$.data.items[0].id").value(id.toString()));
        assertThat(auditCount(id, "delete")).isEqualTo(1);
    }

    @Test
    void delete_otherTeacherOrAdmin_AC_BH_60() throws Exception {
        UUID ofB = lesson(teacherB, "B", "draft");

        asA(delete(TEACHER_URL + "/" + ofB)).andExpect(status().isForbidden());
        asAdmin(delete(TEACHER_URL + "/" + ofB)).andExpect(status().isForbidden());
        assertThat(deletedAt(ofB)).isNull();
    }

    @Test
    void delete_alreadyDeleted_keepsDeletedAt_AC_BH_90() throws Exception {
        Instant at = Instant.now().minus(Duration.ofDays(2)).truncatedTo(java.time.temporal.ChronoUnit.MILLIS);
        UUID id = lesson(teacherA, "Gone", "draft", topic, "B1", false, at, randomVideo());

        asA(delete(TEACHER_URL + "/" + id))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LESSON_ALREADY_DELETED"));
        assertThat(deletedAt(id)).isEqualTo(at);
    }

    // ------------------------------------------------------------------ UC-BH-09 khôi phục

    @Test
    void restore_publishedLessonComesBackAsDraftWithSentences_AC_BH_63() throws Exception {
        UUID id = lesson(teacherA, "Airport English", "published", topic, "B1", false,
                Instant.now().minus(Duration.ofDays(5)), randomVideo());
        sentences(id, 4);

        asA(post(TEACHER_URL + "/" + id + "/restore")).andExpect(status().isNoContent());

        assertThat(statusOf(id)).isEqualTo("draft");
        assertThat(deletedAt(id)).isNull();
        asA(get(TEACHER_URL + "/" + id)).andExpect(jsonPath("$.data.sentenceCount").value(4));
        assertThat(auditCount(id, "restore")).isEqualTo(1);
    }

    @Test
    void restore_titleTaken_needsNewTitle_AC_BH_64() throws Exception {
        UUID old = lesson(teacherA, "Airport English", "draft", topic, "B1", false,
                Instant.now().minus(Duration.ofDays(5)), randomVideo());
        lesson(teacherA, "Airport English", "draft");

        asA(post(TEACHER_URL + "/" + old + "/restore"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LESSON_TITLE_TAKEN"));
        asA(post(TEACHER_URL + "/" + old + "/restore").content("{\"title\":\"Airport English (cũ)\"}"))
                .andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("SELECT title FROM lessons WHERE id = ?", String.class, old))
                .isEqualTo("Airport English (cũ)");
    }

    @Test
    void restore_expiredOrNotDeleted_AC_BH_65_66() throws Exception {
        UUID expired = lesson(teacherA, "Old", "draft", topic, "B1", false,
                Instant.now().minus(Duration.ofDays(31)), randomVideo());
        UUID alive = lesson(teacherA, "Alive", "draft");

        asA(post(TEACHER_URL + "/" + expired + "/restore"))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.code").value("LESSON_RESTORE_EXPIRED"));
        asA(post(TEACHER_URL + "/" + alive + "/restore"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LESSON_NOT_DELETED"));
    }

    @Test
    void restore_videoUsedByAnotherLesson_AC_BH_96() throws Exception {
        String video = randomVideo();
        UUID old = lesson(teacherA, "Airport English", "draft", topic, "B1", false,
                Instant.now().minus(Duration.ofDays(5)), video);
        lesson(teacherB, "Check-in Tips", "draft", topic, "B1", false, null, video);

        asA(post(TEACHER_URL + "/" + old + "/restore"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("LESSON_VIDEO_TAKEN"));
        assertThat(deletedAt(old)).isNotNull();
    }

    // ------------------------------------------------------------------ UC-BH-10 tạo lại gợi ý

    @Test
    void suggest_translationAndIpa_savesNothing_AC_BH_69_75() throws Exception {
        UUID id = lesson(teacherA, "L", "draft");
        List<UUID> s = sentences(id, 3);
        when(gemini.generate(any())).thenReturn(new Result("{\"items\":[{\"id\":0,\"vi\":\"Gợi ý mới\"}]}", 300, 100));

        asA(post(TEACHER_URL + "/" + id + "/suggestions").content("""
                {"sentences":[{"id":"%s","textEn":"Sentence 2 edited"}],"translation":true,"ipa":true}"""
                .formatted(s.get(2))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sentences[0].id").value(s.get(2).toString()))
                .andExpect(jsonPath("$.data.sentences[0].textVi").value("Gợi ý mới"))
                .andExpect(jsonPath("$.data.sentences[0].ipaUs").value("ipa-us"))
                .andExpect(jsonPath("$.data.translationOutcome").value("COMPLETE"));

        // gợi ý chỉ điền vào ô, không lưu; chưa trừ credit (module credit làm sau)
        assertThat(jdbc.queryForObject("SELECT text_vi FROM sentences WHERE id = ?", String.class, s.get(2)))
                .isEqualTo("Câu 2");
        assertThat(balance(teacherA)).isEqualTo(100);
    }

    @Test
    void suggest_aiFailure_keepsCellsEmpty_AC_BH_74() throws Exception {
        UUID id = lesson(teacherA, "L", "draft");
        List<UUID> s = sentences(id, 1);
        when(gemini.generate(any())).thenThrow(new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE));

        asA(post(TEACHER_URL + "/" + id + "/suggestions").content("""
                {"sentences":[{"id":"%s","textEn":"Sentence 0"}],"translation":true,"ipa":false}"""
                .formatted(s.get(0))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.translationOutcome").value("AI_FAILED"))
                .andExpect(jsonPath("$.data.sentences[0].textVi").doesNotExist());
    }

    @Test
    void suggest_sentenceOfAnotherLessonOrOtherTeacher_rejected() throws Exception {
        UUID mine = lesson(teacherA, "Mine", "draft");
        UUID ofB = lesson(teacherB, "B", "draft");
        List<UUID> bSentences = sentences(ofB, 1);
        String body = """
                {"sentences":[{"id":"%s","textEn":"x"}],"translation":false,"ipa":true}""".formatted(bSentences.get(0));

        asA(post(TEACHER_URL + "/" + mine + "/suggestions").content(body))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("LESSON_SENTENCE_NOT_FOUND"));
        asA(post(TEACHER_URL + "/" + ofB + "/suggestions").content(body)).andExpect(status().isForbidden());
    }
}
