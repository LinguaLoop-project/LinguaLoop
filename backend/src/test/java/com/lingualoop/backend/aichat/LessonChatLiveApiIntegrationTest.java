package com.lingualoop.backend.aichat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
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

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.aichat.LessonChatAi.Generated;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.support.TestData;
import com.lingualoop.backend.tutor.LiveTokenIssuer;
import com.lingualoop.backend.tutor.LiveTokenIssuer.LiveSpec;
import com.lingualoop.backend.tutor.LiveTokenIssuer.LiveToken;
import com.lingualoop.backend.user.service.UserAccountService;

/**
 * Thực hành với AI theo bài (UC-AI-01), chế độ giọng nói: Gemini Live nằm ở trình duyệt nên server chỉ cấp token và ghi
 * lại các lượt do gia sư báo qua tool. Ở đây kiểm token, việc trừ credit cố định một lần, giới hạn 5 câu và 15 phút.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class LessonChatLiveApiIntegrationTest {

    private static final String BASE = "/api/v1/lessons/%s/ai-chat";
    private static final int COST = 5;

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private LessonFixtures fixtures;
    @Autowired private JdbcTemplate jdbc;

    @MockitoBean private LessonChatAi ai;
    @MockitoBean private LiveTokenIssuer tokenIssuer;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    @BeforeEach
    void defaults() {
        reset(ai, tokenIssuer);
        when(tokenIssuer.issueWith(any())).thenReturn(
                new LiveToken("auth_tokens/test", "gemini-live-test", Instant.now().plus(Duration.ofMinutes(17))));
        when(ai.hint(any(), any())).thenReturn(generated("Gợi ý: dùng 'He is ...'"));
        when(ai.summarize(any(), any())).thenReturn(generated("Bạn hiểu bài khá tốt."));
    }

    // ── AC-AI-01 ───────────────────────────────────────────────────────────────────

    @Test
    void startLive_issuesTokenLockedToTheLessonAndDoesNotCharge_AC_AI_01() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);

        startLive(user, lesson)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.token").value("auth_tokens/test"))
                .andExpect(jsonPath("$.data.model").value("gemini-live-test"))
                .andExpect(jsonPath("$.data.limits.maxQuestions").value(5))
                .andExpect(jsonPath("$.data.limits.maxSeconds").value(900))
                .andExpect(jsonPath("$.data.cost").value(COST))
                .andExpect(jsonPath("$.data.balance.balance").value(20)); // chưa trừ

        ArgumentCaptor<LiveSpec> spec = ArgumentCaptor.forClass(LiveSpec.class);
        verify(tokenIssuer).issueWith(spec.capture());
        assertThat(spec.getValue().systemPrompt()).contains("I woke up early today", "Then I went to work", "Morning");
        assertThat(spec.getValue().tools()).extracting(tool -> tool.name().orElseThrow())
                .containsExactly("next_question", "give_feedback", "end_session");
        assertThat(spec.getValue().lifetime()).isEqualTo(Duration.ofMinutes(17));
        assertThat(spec.getValue().compressContext()).isTrue();
        assertThat(balance(user)).isEqualTo(20);
        assertThat(used(user)).isZero();
    }

    @Test
    void liveStarted_chargesTheFixedCostOnlyOnce_AC_AI_01() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = startLiveSession(user, lesson);

        started(user, lesson, session)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.charged").value(COST))
                .andExpect(jsonPath("$.data.balance.balance").value(20 - COST));
        started(user, lesson, session) // trình duyệt báo lặp: không trừ thêm
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.charged").value(0))
                .andExpect(jsonPath("$.data.balance.balance").value(20 - COST));

        assertThat(used(user)).isEqualTo(COST);
    }

    // ── AC-AI-02 ───────────────────────────────────────────────────────────────────

    @Test
    void questionsAndFeedback_areStoredPerTurnAsVoice_AC_AI_02() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = runningSession(user, lesson);

        question(user, lesson, session, "  Who is talking in the video?  ")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.messages.length()").value(1))
                .andExpect(jsonPath("$.data.messages[0].role").value("tutor"))
                .andExpect(jsonPath("$.data.messages[0].text").value("Who is talking in the video?"));
        feedback(user, lesson, session, "A man is talking.", "Đúng rồi, đó là một người đàn ông.",
                "A man is speaking at the start.")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.answered").value(1))
                .andExpect(jsonPath("$.data.mode").value("live"))
                .andExpect(jsonPath("$.data.messages[1].role").value("student"))
                .andExpect(jsonPath("$.data.messages[1].text").value("A man is talking."))
                .andExpect(jsonPath("$.data.messages[1].feedback").value("Đúng rồi, đó là một người đàn ông."))
                .andExpect(jsonPath("$.data.messages[1].better").value("A man is speaking at the start."))
                .andExpect(jsonPath("$.data.messages[1].voice").value(true));
        assertThat(balance(user)).isEqualTo(20 - COST); // các lượt không trừ thêm
    }

    @Test
    void turnsOutOfOrder_areRejected_AC_AI_02() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = runningSession(user, lesson);

        feedback(user, lesson, session, "A man.", "Tốt.", "").andExpect(status().isConflict()) // chưa có câu hỏi
                .andExpect(jsonPath("$.code").value("AI_CHAT_TURN_CONFLICT"));
        question(user, lesson, session, "Q1?").andExpect(status().isOk());
        question(user, lesson, session, "Q1 again?").andExpect(status().isConflict()) // câu trước chưa trả lời
                .andExpect(jsonPath("$.code").value("AI_CHAT_TURN_CONFLICT"));
        feedback(user, lesson, session, "A man.", "Tốt.", "").andExpect(status().isOk());
        feedback(user, lesson, session, "A man.", "Tốt.", "").andExpect(status().isConflict()); // đã có câu trả lời

        assertThat(count("ai_conversation_messages WHERE conversation_id = ?", session)).isEqualTo(2);
    }

    @Test
    void emptyAnswerOrQuestion_isRejected_AC_AI_10() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = runningSession(user, lesson);

        question(user, lesson, session, "   ").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AI_CHAT_ANSWER_INVALID"));
        question(user, lesson, session, "Q1?").andExpect(status().isOk());
        feedback(user, lesson, session, "  ", "Tốt.", "").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AI_CHAT_ANSWER_INVALID"));
        feedback(user, lesson, session, "A man.", "", "").andExpect(status().isBadRequest());

        // câu trả lời quá dài bị cắt ở 1000 ký tự thay vì làm hỏng lượt
        feedback(user, lesson, session, "x".repeat(1500), "Tốt.", "").andExpect(status().isOk());
        assertThat(jdbc.queryForObject("""
                SELECT length(content) FROM ai_conversation_messages WHERE conversation_id = ? AND role = 'student'""",
                Integer.class, session)).isEqualTo(1000);
    }

    // ── AC-AI-03 ───────────────────────────────────────────────────────────────────

    @Test
    void hint_isFreeInLiveSessions_AC_AI_03() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = runningSession(user, lesson);
        question(user, lesson, session, "Who is talking?").andExpect(status().isOk());
        int before = balance(user);

        hint(user, lesson, session).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hint").value("Gợi ý: dùng 'He is ...'"))
                .andExpect(jsonPath("$.data.cached").value(false));
        hint(user, lesson, session).andExpect(jsonPath("$.data.cached").value(true));

        assertThat(balance(user)).isEqualTo(before);
    }

    // ── AC-AI-04 ───────────────────────────────────────────────────────────────────

    @Test
    void restart_closesTheOldLiveSessionAndKeepsOnlySessionsWithContentInHistory_AC_AI_04() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID first = runningSession(user, lesson);
        question(user, lesson, first, "Q1?").andExpect(status().isOk());
        feedback(user, lesson, first, "A man.", "Tốt.", "").andExpect(status().isOk());
        UUID neverStarted = startLiveSession(user, lesson); // đóng phiên trước, phiên này chưa được dùng
        UUID third = startLiveSession(user, lesson);

        assertThat(statusOf(first)).isEqualTo("completed");
        assertThat(statusOf(neverStarted)).isEqualTo("error"); // chưa bắt đầu, chưa trừ credit
        assertThat(count("ai_conversations WHERE user_id = ? AND lesson_id = ? AND status = 'active'", user, lesson))
                .isEqualTo(1);
        mockMvc.perform(get(BASE.formatted(lesson) + "/sessions").headers(auth(user)))
                .andExpect(jsonPath("$.data.length()").value(1)) // phiên rỗng không hiện trong lịch sử
                .andExpect(jsonPath("$.data[0].id").value(first.toString()))
                .andExpect(jsonPath("$.data[0].answered").value(1));
        assertThat(third).isNotEqualTo(first);
    }

    // ── AC-AI-05 ───────────────────────────────────────────────────────────────────

    @Test
    void finish_createsSummaryWithoutChargingAgain_AC_AI_05() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = runningSession(user, lesson);
        question(user, lesson, session, "Q1?").andExpect(status().isOk());
        feedback(user, lesson, session, "A man.", "Tốt.", "").andExpect(status().isOk());
        int before = balance(user);

        finish(user, lesson, session)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.session.status").value("completed"))
                .andExpect(jsonPath("$.data.session.summary").value("Bạn hiểu bài khá tốt."))
                .andExpect(jsonPath("$.data.credit.charged").value(0));

        assertThat(balance(user)).isEqualTo(before);
        question(user, lesson, session, "Q2?").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AI_CHAT_NOT_ACTIVE"));
    }

    @Test
    void finishBeforeAnyAnswer_closesWithoutSummary_AC_AI_05() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = runningSession(user, lesson);

        finish(user, lesson, session).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.session.status").value("completed"))
                .andExpect(jsonPath("$.data.session.summary").doesNotExist());

        verify(ai, never()).summarize(any(), any());
    }

    @Test
    void sixthQuestion_isRejected_AC_AI_05() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = runningSession(user, lesson);
        for (int i = 1; i <= 5; i++) {
            question(user, lesson, session, "Question " + i + "?").andExpect(status().isOk());
            feedback(user, lesson, session, "Answer " + i, "Tốt.", "").andExpect(status().isOk());
        }

        question(user, lesson, session, "Question 6?").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AI_CHAT_QUESTION_LIMIT"));

        mockMvc.perform(get(BASE.formatted(lesson) + "/sessions/" + session).headers(auth(user)))
                .andExpect(jsonPath("$.data.answered").value(5))
                .andExpect(jsonPath("$.data.awaitingSummary").value(true))
                .andExpect(jsonPath("$.data.messages.length()").value(10));
    }

    @Test
    void after15Minutes_turnsAreNotAcceptedButTheSessionCanStillBeFinished_AC_AI_05() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = runningSession(user, lesson);
        question(user, lesson, session, "Q1?").andExpect(status().isOk());
        feedback(user, lesson, session, "A man.", "Tốt.", "").andExpect(status().isOk());
        backdate(session, 15 * 60 + 1);

        question(user, lesson, session, "Q2?").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AI_CHAT_NOT_ACTIVE"));
        hint(user, lesson, session).andExpect(status().isConflict());
        finish(user, lesson, session).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.session.summary").value("Bạn hiểu bài khá tốt."));
    }

    @Test
    void turnsBeforeTheSessionStarted_areNotAccepted_AC_AI_05() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = startLiveSession(user, lesson); // chưa gọi started: chưa trừ credit

        question(user, lesson, session, "Q1?").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AI_CHAT_NOT_ACTIVE"));
    }

    // ── AC-AI-06 ───────────────────────────────────────────────────────────────────

    @Test
    void otherStudentsAndTextEndpoints_cannotTouchALiveSession_AC_AI_06() throws Exception {
        UUID owner = newUser();
        UUID other = newUser();
        UUID lesson = lesson(false);
        UUID session = runningSession(owner, lesson);
        question(owner, lesson, session, "Q1?").andExpect(status().isOk());

        question(other, lesson, session, "Hi?").andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("AI_CHAT_NOT_FOUND"));
        feedback(other, lesson, session, "A.", "B.", "").andExpect(status().isNotFound());
        started(other, lesson, session).andExpect(status().isNotFound());
        finish(other, lesson, session).andExpect(status().isNotFound());
        hint(other, lesson, session).andExpect(status().isNotFound());
        // phiên giọng nói không đi qua các endpoint chat chữ
        mockMvc.perform(post(BASE.formatted(lesson) + "/sessions/" + session + "/answers")
                .contentType(MediaType.APPLICATION_JSON).content("{\"text\": \"Hello\"}").headers(auth(owner)))
                .andExpect(status().isNotFound());
        mockMvc.perform(post(BASE.formatted(lesson) + "/sessions/" + session + "/finish").headers(auth(owner)))
                .andExpect(status().isNotFound());
    }

    @Test
    void liveEndpoints_areForStudentsOnly_AC_AI_06() throws Exception {
        UUID lesson = lesson(false);
        mockMvc.perform(post(BASE.formatted(lesson) + "/live-sessions")).andExpect(status().isUnauthorized());
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(
                jwtTokenService.issueAccessToken(newUser(), Role.TEACHER, UUID.randomUUID()).token());
        mockMvc.perform(post(BASE.formatted(lesson) + "/live-sessions").headers(headers))
                .andExpect(status().isForbidden());
    }

    // ── AC-AI-07 ───────────────────────────────────────────────────────────────────

    @Test
    void startLive_isRejectedWhenBalanceIsBelowTheMinimum_AC_AI_07() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        TestData.setCredits(jdbc, user, 4);

        startLive(user, lesson).andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("QUOTA_EXCEEDED"));

        verify(tokenIssuer, never()).issueWith(any());
        assertThat(count("ai_conversations WHERE user_id = ?", user)).isZero();
    }

    @Test
    void started_isRejectedWhenTheWalletDroppedBelowTheCostMeanwhile_AC_AI_07() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = startLiveSession(user, lesson);
        TestData.setCredits(jdbc, user, COST - 1); // vd dùng hết ở tab khác

        started(user, lesson, session).andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("QUOTA_EXCEEDED"));

        assertThat(statusOf(session)).isEqualTo("error");
        assertThat(balance(user)).isEqualTo(COST - 1);
    }

    // ── AC-AI-08, 09 ───────────────────────────────────────────────────────────────

    @Test
    void proStudent_paysTheFixedCostFromThePlanCredits_AC_AI_08() throws Exception {
        UUID user = newUser();
        TestData.grantPro(jdbc, user, 1);
        UUID lesson = lesson(true);

        UUID session = startLiveSession(user, lesson);
        started(user, lesson, session).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.balance.kind").value("pro"))
                .andExpect(jsonPath("$.data.balance.balance").value(TestData.PRO_CREDITS_PER_MONTH - COST));
    }

    @Test
    void proLesson_isRejectedForFreeStudent_AC_AI_09() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(true);

        startLive(user, lesson).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));

        verify(tokenIssuer, never()).issueWith(any());
    }

    // ── AC-AI-11 ───────────────────────────────────────────────────────────────────

    @Test
    void tokenFailure_closesTheSessionWithErrorAndDoesNotCharge_AC_AI_11() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        when(tokenIssuer.issueWith(any())).thenThrow(new IllegalStateException("Gemini quá tải"));

        startLive(user, lesson).andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("AI_CHAT_LIVE_UNAVAILABLE"));

        assertThat(balance(user)).isEqualTo(20);
        assertThat(used(user)).isZero();
        assertThat(jdbc.queryForObject("SELECT status FROM ai_conversations WHERE user_id = ?", String.class, user))
                .isEqualTo("error");
        // dự phòng chat chữ vẫn mở được phiên khác
        when(ai.open(any())).thenReturn(generated("Who is talking?"));
        mockMvc.perform(post(BASE.formatted(lesson) + "/sessions").headers(auth(user))).andExpect(status().isOk());
    }

    @Test
    void summaryFailure_keepsTheSessionOpenForRetryAndDoesNotChargeAgain_AC_AI_11() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = runningSession(user, lesson);
        question(user, lesson, session, "Q1?").andExpect(status().isOk());
        feedback(user, lesson, session, "A man.", "Tốt.", "").andExpect(status().isOk());
        when(ai.summarize(any(), any())).thenThrow(new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE))
                .thenReturn(generated("Tổng kết."));
        int before = balance(user);

        finish(user, lesson, session).andExpect(status().isBadGateway());

        assertThat(statusOf(session)).isEqualTo("active");
        assertThat(count("ai_conversation_messages WHERE conversation_id = ?", session)).isEqualTo(2);
        finish(user, lesson, session).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.session.summary").value("Tổng kết."));
        assertThat(balance(user)).isEqualTo(before);
    }

    // ── Hỗ trợ ─────────────────────────────────────────────────────────────────────

    private ResultActions startLive(UUID user, UUID lesson) throws Exception {
        return mockMvc.perform(post(BASE.formatted(lesson) + "/live-sessions").headers(auth(user)));
    }

    private UUID startLiveSession(UUID user, UUID lesson) throws Exception {
        String body = startLive(user, lesson).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return UUID.fromString(com.jayway.jsonpath.JsonPath.read(body, "$.data.id"));
    }

    /** Phiên đã bắt đầu (đã trừ credit cố định), sẵn sàng nhận câu hỏi. */
    private UUID runningSession(UUID user, UUID lesson) throws Exception {
        UUID session = startLiveSession(user, lesson);
        started(user, lesson, session).andExpect(status().isOk());
        return session;
    }

    private ResultActions started(UUID user, UUID lesson, UUID session) throws Exception {
        return mockMvc.perform(post(BASE.formatted(lesson) + "/live-sessions/" + session + "/started")
                .headers(auth(user)));
    }

    private ResultActions question(UUID user, UUID lesson, UUID session, String question) throws Exception {
        return mockMvc.perform(post(BASE.formatted(lesson) + "/live-sessions/" + session + "/questions")
                .contentType(MediaType.APPLICATION_JSON).content(json("question", question)).headers(auth(user)));
    }

    private ResultActions feedback(UUID user, UUID lesson, UUID session, String answer, String feedback, String better)
            throws Exception {
        return mockMvc.perform(post(BASE.formatted(lesson) + "/live-sessions/" + session + "/feedback")
                .contentType(MediaType.APPLICATION_JSON)
                .content(json("answer", answer, "feedback", feedback, "better", better)).headers(auth(user)));
    }

    private ResultActions finish(UUID user, UUID lesson, UUID session) throws Exception {
        return mockMvc.perform(post(BASE.formatted(lesson) + "/live-sessions/" + session + "/finish")
                .headers(auth(user)));
    }

    private ResultActions hint(UUID user, UUID lesson, UUID session) throws Exception {
        return mockMvc.perform(post(BASE.formatted(lesson) + "/sessions/" + session + "/hint").headers(auth(user)));
    }

    private static String json(String... pairs) throws Exception {
        var node = new com.fasterxml.jackson.databind.ObjectMapper().createObjectNode();
        for (int i = 0; i < pairs.length; i += 2) {
            node.put(pairs[i], pairs[i + 1]);
        }
        return node.toString();
    }

    private HttpHeaders auth(UUID user) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtTokenService.issueAccessToken(user, Role.STUDENT, UUID.randomUUID()).token());
        return headers;
    }

    private UUID newUser() {
        return userAccountService.createLocal("live-" + UUID.randomUUID() + "@x.com", "Live", "h").id();
    }

    private UUID lesson(boolean pro) {
        UUID topic = fixtures.topic("Live topic " + UUID.randomUUID());
        UUID lesson = fixtures.lesson(topic, "Morning " + tag + " " + UUID.randomUUID().toString().substring(0, 4), pro,
                "published", "B1", 0, false);
        fixtures.sentence(lesson, 0, "I woke up early today.");
        fixtures.sentence(lesson, 1, "Then I went to work.");
        return lesson;
    }

    private void backdate(UUID session, int seconds) {
        jdbc.update("UPDATE ai_conversations SET started_at = now() - make_interval(secs => ?) WHERE id = ?", seconds,
                session);
    }

    private String statusOf(UUID session) {
        return jdbc.queryForObject("SELECT status FROM ai_conversations WHERE id = ?", String.class, session);
    }

    private int used(UUID user) {
        Integer n = jdbc.queryForObject(
                "SELECT coalesce(sum(credits_charged), 0) FROM ai_usage_logs WHERE user_id = ? AND status = 'success'",
                Integer.class, user);
        return n == null ? 0 : n;
    }

    private int balance(UUID user) {
        List<Integer> rows = jdbc.queryForList("SELECT balance FROM ai_wallets WHERE user_id = ?", Integer.class, user);
        return rows.isEmpty() ? 20 : rows.get(0);
    }

    private int count(String fromWhere, Object... args) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM " + fromWhere, Integer.class, args);
        return n == null ? 0 : n;
    }

    private static <T> Generated<T> generated(T value) {
        return new Generated<>(value, 100, 40);
    }
}
