package com.lingualoop.backend.shadowing.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CyclicBarrier;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
import java.util.function.Consumer;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.ai.AiFeedbackGenerator;
import com.lingualoop.backend.ai.FeedbackRequest;
import com.lingualoop.backend.ai.GeneratedFeedback;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.Sentence;
import com.lingualoop.backend.lesson.entity.Topic;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import com.lingualoop.backend.lesson.enums.LessonStatus;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.lesson.repository.TopicRepository;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.service.ConsentService;
import com.lingualoop.backend.user.service.UserAccountService;

/** Nhận xét AI cho một lượt shadowing (UC-SHADOW-09): một lượt một nhận xét, hạn mức theo gói, hoàn lượt khi lỗi. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AiFeedbackIntegrationTest {

    private static final GeneratedFeedback FEEDBACK =
            new GeneratedFeedback("Bạn đọc khá tốt, chú ý âm /θ/.", "gemini-test", "shadowing-feedback-v1", 120, 40);

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private TopicRepository topics;
    @Autowired private LessonRepository lessons;
    @Autowired private SentenceRepository sentences;
    @Autowired private JdbcTemplate jdbc;

    @MockitoBean private AiFeedbackGenerator generator;
    @MockitoBean private ConsentService consent;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    @BeforeEach
    void defaults() {
        reset(generator);
        when(consent.hasConsent(any(), any())).thenReturn(true);
        when(generator.generate(any())).thenReturn(FEEDBACK);
    }

    @Test
    void feedback_isCreatedOnceThenServedFromStorageWithoutCharging_AC_SHADOW_24() throws Exception {
        UUID user = newUser();
        long attempt = attempt(user, sentence("once"));

        feedback(user, attempt)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value(FEEDBACK.content()))
                .andExpect(jsonPath("$.data.cached").value(false))
                .andExpect(jsonPath("$.data.usage.feature").value("ai_energy"))
                .andExpect(jsonPath("$.data.usage.used").value(1))
                .andExpect(jsonPath("$.data.usage.limit").value(8));

        feedback(user, attempt)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content").value(FEEDBACK.content()))
                .andExpect(jsonPath("$.data.cached").value(true))
                .andExpect(jsonPath("$.data.usage.used").value(1));

        verify(generator, times(1)).generate(any());
        assertThat(jdbc.queryForObject("""
                SELECT model || '|' || prompt_version || '|' || input_tokens || '|' || output_tokens
                FROM ai_feedback WHERE attempt_id = ?""", String.class, attempt))
                .isEqualTo("gemini-test|shadowing-feedback-v1|120|40");
    }

    @Test
    void feedback_sendsOnlyTextAndScoresIncludingWeakPhonemes_AC_SHADOW_24() throws Exception {
        UUID user = newUser();
        Sentence s = sentence("input");
        long attempt = attempt(user, s);
        long word = jdbc.queryForObject("""
                INSERT INTO sentence_attempt_words (attempt_id, position, expected_word, actual_word, outcome, accuracy_score)
                VALUES (?, 0, 'think', 'think', 'mispronounced', 55) RETURNING id""", Long.class, attempt);
        jdbc.update("""
                INSERT INTO sentence_attempt_phonemes (attempt_word_id, position, phoneme_id, accuracy_score)
                VALUES (?, 0, (SELECT id FROM phonemes WHERE symbol = 'θ'), 30),
                       (?, 1, (SELECT id FROM phonemes WHERE symbol = 'ɪ'), 90)""", word, word);

        feedback(user, attempt).andExpect(status().isOk());

        ArgumentCaptor<FeedbackRequest> captor = ArgumentCaptor.forClass(FeedbackRequest.class);
        verify(generator).generate(captor.capture());
        FeedbackRequest request = captor.getValue();
        assertThat(request.sentenceText()).isEqualTo("Think about it");
        assertThat(request.score()).isEqualTo(70.0);
        assertThat(request.words()).hasSize(1);
        assertThat(request.words().get(0).weakPhonemes()).extracting(FeedbackRequest.Phoneme::symbol)
                .containsExactly("θ");
    }

    @Test
    void feedback_ofAnotherUsersOrUnknownAttempt_returns404_AC_SHADOW_25() throws Exception {
        UUID owner = newUser();
        long attempt = attempt(owner, sentence("owner"));

        feedback(newUser(), attempt).andExpect(status().isNotFound());
        feedback(owner, 999_999_999L).andExpect(status().isNotFound());

        verify(generator, times(0)).generate(any());
    }

    @Test
    void feedback_withoutAiConsent_returns403AndDoesNotCharge_AC_SHADOW_26() throws Exception {
        UUID user = newUser();
        long attempt = attempt(user, sentence("consent"));
        when(consent.hasConsent(any(), any())).thenReturn(false);

        feedback(user, attempt)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AI_CONSENT_REQUIRED"));

        assertThat(used(user)).isZero();
        verify(generator, times(0)).generate(any());
    }

    @Test
    void feedback_costsOneEnergy_freeHasEightPerDay_proIsUnlimited_AC_SHADOW_27() throws Exception {
        UUID free = newUser();
        UUID pro = newUser();
        makePro(pro);
        Sentence s = sentence("limits");
        for (int i = 0; i < 8; i++) {
            feedback(free, attempt(free, s)).andExpect(status().isOk());
        }
        long ninth = attempt(free, s);

        feedback(free, ninth)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("QUOTA_EXCEEDED"))
                .andExpect(jsonPath("$.details.feature").value("ai_energy"))
                .andExpect(jsonPath("$.details.action").value("ai_feedback"));
        assertThat(count("ai_feedback WHERE attempt_id = ?", ninth)).isZero();

        for (int i = 0; i < 7; i++) {
            feedback(pro, attempt(pro, s)).andExpect(status().isOk());
        }
        assertThat(used(pro)).isEqualTo(7);
    }

    @Test
    void feedback_whenAiFails_returns502AndGivesTheAttemptBack_AC_SHADOW_28() throws Exception {
        UUID user = newUser();
        long attempt = attempt(user, sentence("fail"));
        when(generator.generate(any())).thenThrow(new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE));

        feedback(user, attempt)
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.code").value("AI_FEEDBACK_UNAVAILABLE"));

        assertThat(used(user)).isZero();
        assertThat(count("ai_feedback WHERE attempt_id = ?", attempt)).isZero();
    }

    @Test
    void feedback_twoRequestsAtOnce_storeOneFeedbackAndChargeOnce_AC_SHADOW_29() throws Exception {
        UUID user = newUser();
        long attempt = attempt(user, sentence("race"));
        // Cả hai yêu cầu cùng qua bước "chưa có nhận xét" rồi mới cùng viết xong: bên chậm hơn đụng UNIQUE(attempt_id)
        CyclicBarrier bothInside = new CyclicBarrier(2);
        when(generator.generate(any())).thenAnswer(invocation -> {
            bothInside.await(10, TimeUnit.SECONDS);
            return FEEDBACK;
        });

        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<Integer>> results = new ArrayList<>();
            for (int i = 0; i < 2; i++) {
                results.add(pool.submit(() -> feedback(user, attempt).andReturn().getResponse().getStatus()));
            }
            for (Future<Integer> f : results) {
                assertThat(f.get(30, TimeUnit.SECONDS)).isEqualTo(200);
            }
        } finally {
            pool.shutdownNow();
        }

        assertThat(count("ai_feedback WHERE attempt_id = ?", attempt)).isEqualTo(1);
        assertThat(used(user)).isEqualTo(1);
    }

    // ── Phát dần (Server-Sent Events) ───────────────────────────────────────────────

    @SuppressWarnings("unchecked")
    private void generatesInTwoPieces() {
        when(generator.generate(any(), any())).thenAnswer(invocation -> {
            Consumer<String> onText = invocation.getArgument(1);
            onText.accept("Bạn đọc ");
            onText.accept("khá tốt.");
            return new GeneratedFeedback("Bạn đọc khá tốt.", "gemini-test", "shadowing-feedback-v1", 120, 40);
        });
    }

    private String body(ResultActions result) throws Exception {
        return result.andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
    }

    @Test
    void stream_sendsTextPiecesThenTheFullFeedbackAndStoresIt_AC_SHADOW_30() throws Exception {
        UUID user = newUser();
        long attempt = attempt(user, sentence("stream"));
        generatesInTwoPieces();

        ResultActions result = streamOf(user, attempt)
                .andExpect(status().isOk())
                .andExpect(org.springframework.test.web.servlet.result.MockMvcResultMatchers.content()
                        .contentTypeCompatibleWith("text/event-stream"));
        String body = body(result);

        assertThat(body).contains("event: delta\ndata: {\"text\":\"Bạn đọc \"}\n\n");
        assertThat(body).contains("event: delta\ndata: {\"text\":\"khá tốt.\"}\n\n");
        assertThat(body.indexOf("khá tốt.")).isLessThan(body.indexOf("event: done"));
        assertThat(body).contains("\"content\":\"Bạn đọc khá tốt.\"").contains("\"cached\":false");
        assertThat(used(user)).isEqualTo(1);
        assertThat(count("ai_feedback WHERE attempt_id = ?", attempt)).isEqualTo(1);
    }

    @Test
    void stream_ofAnAttemptWithFeedback_sendsTheStoredTextOnceAndDoesNotCharge_AC_SHADOW_30() throws Exception {
        UUID user = newUser();
        long attempt = attempt(user, sentence("stream-cached"));
        feedback(user, attempt).andExpect(status().isOk());

        String body = body(streamOf(user, attempt).andExpect(status().isOk()));

        assertThat(body).contains("event: delta").contains(FEEDBACK.content()).contains("\"cached\":true");
        assertThat(used(user)).isEqualTo(1);
        verify(generator, times(1)).generate(any());
    }

    @Test
    void stream_whenAiFailsBeforeAnyText_returnsTheNormalErrorStatus_AC_SHADOW_31() throws Exception {
        UUID user = newUser();
        long attempt = attempt(user, sentence("stream-fail-early"));
        when(generator.generate(any(), any())).thenThrow(new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE));

        streamOf(user, attempt)
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.code").value("AI_FEEDBACK_UNAVAILABLE"));

        assertThat(used(user)).isZero();
    }

    @Test
    void stream_whenAiFailsAfterSomeText_endsWithAnErrorEventAndGivesTheAttemptBack_AC_SHADOW_31() throws Exception {
        UUID user = newUser();
        long attempt = attempt(user, sentence("stream-fail-late"));
        when(generator.generate(any(), any())).thenAnswer(invocation -> {
            Consumer<String> onText = invocation.getArgument(1);
            onText.accept("Bạn đọc ");
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        });

        String body = body(streamOf(user, attempt).andExpect(status().isOk()));

        assertThat(body).contains("event: delta").contains("event: error").contains("AI_FEEDBACK_UNAVAILABLE");
        assertThat(body).doesNotContain("event: done");
        assertThat(used(user)).isZero();
        assertThat(count("ai_feedback WHERE attempt_id = ?", attempt)).isZero();
    }

    @Test
    void stream_withoutAiConsentOrOfAnotherUser_isRejectedBeforeStreaming_AC_SHADOW_31() throws Exception {
        UUID owner = newUser();
        long attempt = attempt(owner, sentence("stream-guard"));

        streamOf(newUser(), attempt).andExpect(status().isNotFound());
        when(consent.hasConsent(any(), any())).thenReturn(false);
        streamOf(owner, attempt).andExpect(status().isForbidden());

        verify(generator, times(0)).generate(any(), any());
    }

    @Test
    void feedback_withoutToken_returns401() throws Exception {
        mockMvc.perform(post("/api/v1/shadowing-attempts/1/ai-feedback")).andExpect(status().isUnauthorized());
    }

    // ── tiện ích ────────────────────────────────────────────────────────────────────

    private ResultActions feedback(UUID user, long attemptId) throws Exception {
        return mockMvc.perform(post("/api/v1/shadowing-attempts/{id}/ai-feedback", attemptId).headers(auth(user)));
    }

    private ResultActions streamOf(UUID user, long attemptId) throws Exception {
        return mockMvc.perform(
                post("/api/v1/shadowing-attempts/{id}/ai-feedback/stream", attemptId).headers(auth(user)));
    }

    private HttpHeaders auth(UUID user) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtTokenService.issueAccessToken(user, Role.STUDENT, UUID.randomUUID()).token());
        return headers;
    }

    private UUID newUser() {
        return userAccountService.createLocal("fb-" + UUID.randomUUID() + "@x.com", "Fb", "h").id();
    }

    private void makePro(UUID user) {
        jdbc.update("INSERT INTO user_subscriptions (user_id, status, expires_at) "
                + "VALUES (?, 'active', now() + interval '10 days')", user);
    }

    private long attempt(UUID user, Sentence sentence) {
        Long id = jdbc.queryForObject("""
                INSERT INTO sentence_attempts (user_id, sentence_id, mode, provider, score)
                VALUES (?, ?, 'shadowing', 'azure', 70) RETURNING id""", Long.class, user, sentence.getId());
        return id == null ? 0 : id;
    }

    private int used(UUID user) {
        Integer n = jdbc.queryForObject(
                "SELECT coalesce(sum(used), 0) FROM usage_counters WHERE user_id = ? AND feature = 'ai_energy'",
                Integer.class, user);
        return n == null ? 0 : n;
    }

    private int count(String fromWhere, Object... args) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM " + fromWhere, Integer.class, args);
        return n == null ? 0 : n;
    }

    private Sentence sentence(String name) {
        Topic topic = new Topic();
        topic.setSlug(name + "-t-" + tag);
        topic.setName(name + " topic");
        topic = topics.save(topic);

        Lesson lesson = new Lesson();
        lesson.setTopic(topic);
        lesson.setSlug(name + "-" + tag);
        lesson.setTitle(name + " " + tag);
        lesson.setDifficulty(CefrLevel.B1);
        lesson.setPro(false);
        lesson.setStatus(LessonStatus.APPROVED);
        lesson = lessons.save(lesson);

        Sentence s = new Sentence();
        s.setLesson(lesson);
        s.setSortOrder(0);
        s.setText("Think about it");
        s.setStartMs(0);
        s.setEndMs(900);
        s.setCefrLevel(CefrLevel.A1);
        return sentences.save(s);
    }
}
