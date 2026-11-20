package com.lingualoop.backend.lesson.controller;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.equalTo;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.getRequestedFor;
import static com.github.tomakehurst.wiremock.client.WireMock.urlPathEqualTo;
import static com.github.tomakehurst.wiremock.core.WireMockConfiguration.wireMockConfig;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import com.github.tomakehurst.wiremock.stubbing.Scenario;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.ai.GeminiJsonClient;
import com.lingualoop.backend.ai.GeminiJsonClient.Result;
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.lesson.ipa.IpaGenerator;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.support.TestData;
import com.lingualoop.backend.vocab.DeckManageTestData;

/**
 * UC-BH-03 với nguồn lời thoại {@code transcriptapi}: YouTube Data API và TranscriptAPI dựng bằng WireMock, Gemini chỉ
 * gợi ý dịch (bản giả).
 */
@SpringBootTest(properties = {
        "app.lesson-import.youtube-api-key=test-youtube-key-not-real",
        "app.lesson-import.transcript-api-key=test-transcript-key-not-real" })
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DeckManageTestData.class, LessonFixtures.class})
class TranscriptApiLessonImportIntegrationTest {

    private static final String URL = "/api/v1/teacher/lessons/youtube";
    private static final String VIDEO_ID = "tApiVid0001";

    @RegisterExtension
    static WireMockExtension remote = WireMockExtension.newInstance()
            .options(wireMockConfig().dynamicPort()).build();

    @DynamicPropertySource
    static void urls(DynamicPropertyRegistry registry) {
        registry.add("app.lesson-import.youtube-api-url", remote::baseUrl);
        registry.add("app.lesson-import.transcript-api-url", remote::baseUrl);
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
        remote.resetAll();
        jdbc.update("UPDATE lessons SET deleted_at = now() WHERE youtube_id = ? AND deleted_at IS NULL", VIDEO_ID);
        teacher = users.teacher("GV " + suffix);
        topic = fixtures.topic("Du lịch " + suffix);
        TestData.setCredits(jdbc, teacher, 100);
        when(ipa.generate(anyList())).thenAnswer(inv -> ((List<?>) inv.getArgument(0)).stream()
                .map(text -> new IpaGenerator.SentenceIpa("ipa", "ipa-uk")).toList());
        when(gemini.generate(any())).thenReturn(new Result(
                "{\"items\":[{\"id\":0,\"vi\":\"Chào mừng đến sân bay.\"},{\"id\":1,\"vi\":\"Xin chuẩn bị hộ chiếu.\"}]}",
                200, 50));
        remote.stubFor(get(urlPathEqualTo("/videos")).willReturn(json(200, """
                {"items":[{"id":"%s","snippet":{"title":"Airport","liveBroadcastContent":"none"},
                 "contentDetails":{"duration":"PT2M","contentRating":{}},
                 "status":{"privacyStatus":"public","uploadStatus":"processed"}}]}""".formatted(VIDEO_ID))));
    }

    private static com.github.tomakehurst.wiremock.client.ResponseDefinitionBuilder json(int status, String body) {
        return aResponse().withStatus(status).withHeader("Content-Type", "application/json").withBody(body);
    }

    private static final String TRANSCRIPT = """
            {"video_id":"%s","language":"en","length_seconds":120,"lengthText":"2:00","transcript":[
              {"text":"[Music]","start":0.0,"duration":3.0},
              {"text":"Welcome to the","start":3.0,"duration":1.2},
              {"text":"airport.","start":4.2,"duration":0.8},
              {"text":"Please have your passport ready.","start":5.5,"duration":2.5}]}""".formatted(VIDEO_ID);

    private ResultActions create() throws Exception {
        return mockMvc.perform(post(URL).contentType(MediaType.APPLICATION_JSON)
                .content("{\"youtubeUrl\":\"https://youtu.be/%s\",\"title\":\"Airport %s\",\"topicId\":\"%s\",\"cefrLevel\":\"B1\",\"pro\":false}"
                        .formatted(VIDEO_ID, suffix, topic))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + users.tokenFor(teacher, Role.TEACHER)));
    }

    @Test
    void create_fromEnglishCaptions_mergesLinesIntoTimedSentencesWithoutAi_AC_BH_14() throws Exception {
        remote.stubFor(get(urlPathEqualTo("/youtube/transcript")).willReturn(json(200, TRANSCRIPT)));

        String response = create()
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.sentenceCount").value(2))
                .andReturn().getResponse().getContentAsString();

        UUID lessonId = UUID.fromString(com.jayway.jsonpath.JsonPath.read(response, "$.data.id"));
        List<Map<String, Object>> rows = jdbc.queryForList(
                "SELECT text_en, text_vi, start_ms, end_ms FROM sentences WHERE lesson_id = ? ORDER BY start_ms",
                lessonId);
        assertThat(rows.get(0)).containsEntry("text_en", "Welcome to the airport.").containsEntry("start_ms", 3000)
                .containsEntry("end_ms", 5000).containsEntry("text_vi", null);
        assertThat(rows.get(1)).containsEntry("text_en", "Please have your passport ready.")
                .containsEntry("start_ms", 5500).containsEntry("end_ms", 8000);
        remote.verify(getRequestedFor(urlPathEqualTo("/youtube/transcript"))
                .withHeader("Authorization", equalTo("Bearer test-transcript-key-not-real"))
                .withQueryParam("video_url", equalTo(VIDEO_ID))
                .withQueryParam("language", equalTo("en"))
                .withQueryParam("include_timestamp", equalTo("true")));
        // tạo bài không gọi AI dịch; giáo viên tự chọn tạo gợi ý sau (UC-BH-10)
        verify(gemini, never()).generate(any());
    }

    @Test
    void create_videoWithoutEnglishCaptions_createsNothingAndChargesNothing_AC_BH_17() throws Exception {
        remote.stubFor(get(urlPathEqualTo("/youtube/transcript")).willReturn(json(404,
                "{\"detail\":\"No transcript available\",\"code\":\"no_captions\"}")));

        create().andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("YOUTUBE_NO_ENGLISH_SPEECH"));

        assertThat(jdbc.queryForObject("SELECT count(*) FROM lessons WHERE owner_id = ?", Integer.class, teacher))
                .isZero();
        verify(gemini, never()).generate(any());
    }

    @Test
    void create_transcriptApiBusy_retriesThenSucceeds() throws Exception {
        remote.stubFor(get(urlPathEqualTo("/youtube/transcript")).inScenario("busy")
                .whenScenarioStateIs(Scenario.STARTED).willReturn(json(503, "{\"detail\":\"busy\",\"code\":\"x\"}"))
                .willSetStateTo("ok"));
        remote.stubFor(get(urlPathEqualTo("/youtube/transcript")).inScenario("busy")
                .whenScenarioStateIs("ok").willReturn(json(200, TRANSCRIPT)));

        create().andExpect(status().isCreated());
        remote.verify(2, getRequestedFor(urlPathEqualTo("/youtube/transcript")));
    }

    @Test
    void create_transcriptApiOutOfCredits_failsWithRetryAndCreatesNothing_AC_BH_83() throws Exception {
        remote.stubFor(get(urlPathEqualTo("/youtube/transcript")).willReturn(json(402,
                "{\"detail\":{\"message\":\"no credits\",\"reason\":\"insufficient_credits\"}}")));

        create().andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("LESSON_TRANSCRIPT_UNAVAILABLE"));

        remote.verify(1, getRequestedFor(urlPathEqualTo("/youtube/transcript")));
        assertThat(jdbc.queryForObject("SELECT balance FROM ai_wallets WHERE user_id = ?", Integer.class, teacher))
                .isEqualTo(100);
    }
}
