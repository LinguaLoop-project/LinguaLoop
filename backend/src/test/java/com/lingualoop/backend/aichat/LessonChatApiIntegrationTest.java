package com.lingualoop.backend.aichat;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.Mockito.doReturn;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.reset;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import com.lingualoop.backend.aichat.LessonChatAi.Reply;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.support.TestData;
import com.lingualoop.backend.user.service.UserAccountService;

/**
 * Thực hành với AI theo bài (UC-AI-01), chế độ chat chữ dự phòng: Gemini được thay bằng bản giả để kiểm luồng, quyền,
 * giới hạn và việc trừ credit theo lượt. Chế độ giọng nói nằm ở {@link LessonChatLiveApiIntegrationTest}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class LessonChatApiIntegrationTest {

    private static final String BASE = "/api/v1/lessons/%s/ai-chat";

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private LessonFixtures fixtures;
    @Autowired private JdbcTemplate jdbc;

    @MockitoBean private LessonChatAi ai;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    @BeforeEach
    void defaults() {
        reset(ai);
        when(ai.open(any())).thenReturn(generated("Who is talking in the video?"));
        when(ai.reply(any(), any(), any(), anyBoolean()))
                .thenReturn(generated(new Reply("Đúng rồi, đó là một người đàn ông.",
                        "A man is speaking at the start.", "Where is he?")));
        when(ai.hint(any(), any())).thenReturn(generated("Gợi ý: dùng 'He is ...'"));
        when(ai.summarize(any(), any())).thenReturn(generated("Bạn hiểu bài khá tốt."));
    }

    // ── AC-AI-01 ───────────────────────────────────────────────────────────────────

    @Test
    void start_asksFirstQuestionFromLessonAndChargesTheOpeningTurn_AC_AI_01() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);

        start(user, lesson)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.session.status").value("active"))
                .andExpect(jsonPath("$.data.session.messages.length()").value(1))
                .andExpect(jsonPath("$.data.session.messages[0].role").value("tutor"))
                .andExpect(jsonPath("$.data.session.messages[0].text").value("Who is talking in the video?"))
                .andExpect(jsonPath("$.data.session.maxQuestions").value(5))
                .andExpect(jsonPath("$.data.credit.charged").value(1)) // giá seed 0 nên trừ tối thiểu 1
                .andExpect(jsonPath("$.data.credit.balance.balance").value(19));

        ArgumentCaptor<LessonChatAi.Lesson> context = ArgumentCaptor.forClass(LessonChatAi.Lesson.class);
        verify(ai).open(context.capture());
        assertThat(context.getValue().transcript()).contains("I woke up early today", "Then I went to work");
        assertThat(used(user)).isEqualTo(1);
    }

    // ── AC-AI-02 ───────────────────────────────────────────────────────────────────

    @Test
    void answerByText_returnsFeedbackAndNextQuestionAndChargesTheTurn_AC_AI_02() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = startSession(user, lesson);

        answerText(user, lesson, session, "  A man is talking.  ")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.session.answered").value(1))
                .andExpect(jsonPath("$.data.session.messages.length()").value(3))
                .andExpect(jsonPath("$.data.session.messages[1].role").value("student"))
                .andExpect(jsonPath("$.data.session.messages[1].text").value("A man is talking."))
                .andExpect(jsonPath("$.data.session.messages[1].feedback").value("Đúng rồi, đó là một người đàn ông."))
                .andExpect(jsonPath("$.data.session.messages[1].better").value("A man is speaking at the start."))
                .andExpect(jsonPath("$.data.session.messages[1].voice").value(false))
                .andExpect(jsonPath("$.data.session.messages[2].text").value("Where is he?"))
                .andExpect(jsonPath("$.data.credit.charged").value(1))
                .andExpect(jsonPath("$.data.credit.balance.balance").value(18));
        assertThat(used(user)).isEqualTo(2); // mở đầu + một lượt
    }

    // ── AC-AI-03 ───────────────────────────────────────────────────────────────────

    @Test
    void hint_isFreeAndGeneratedOncePerQuestion_AC_AI_03() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = startSession(user, lesson);
        int before = balance(user);

        hint(user, lesson, session)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.hint").value("Gợi ý: dùng 'He is ...'"))
                .andExpect(jsonPath("$.data.cached").value(false));
        hint(user, lesson, session)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cached").value(true));

        verify(ai, times(1)).hint(any(), any());
        assertThat(balance(user)).isEqualTo(before);
        // câu hỏi kế tiếp có gợi ý riêng
        answerText(user, lesson, session, "A man.").andExpect(status().isOk());
        hint(user, lesson, session).andExpect(jsonPath("$.data.cached").value(false));
        verify(ai, times(2)).hint(any(), any());
    }

    // ── AC-AI-04 ───────────────────────────────────────────────────────────────────

    @Test
    void restart_closesTheOldSessionAndKeepsItInHistory_AC_AI_04() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID first = startSession(user, lesson);
        answerText(user, lesson, first, "A man.").andExpect(status().isOk());

        UUID second = startSession(user, lesson);

        assertThat(second).isNotEqualTo(first);
        assertThat(count("ai_conversations WHERE user_id = ? AND lesson_id = ? AND status = 'active'", user, lesson))
                .isEqualTo(1);
        mockMvc.perform(get(BASE.formatted(lesson) + "/sessions").headers(auth(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].id").value(second.toString()))
                .andExpect(jsonPath("$.data[1].id").value(first.toString()))
                .andExpect(jsonPath("$.data[1].status").value("completed"))
                .andExpect(jsonPath("$.data[1].answered").value(1))
                .andExpect(jsonPath("$.data[1].hasSummary").value(false));
        // hội thoại cũ còn nguyên
        mockMvc.perform(get(BASE.formatted(lesson) + "/sessions/" + first).headers(auth(user)))
                .andExpect(jsonPath("$.data.messages.length()").value(3));
    }

    // ── AC-AI-05 ───────────────────────────────────────────────────────────────────

    @Test
    void finishAfterAnswering_createsSummaryAndClosesTheSession_AC_AI_05() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = startSession(user, lesson);
        answerText(user, lesson, session, "A man.").andExpect(status().isOk());

        finish(user, lesson, session)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.session.status").value("completed"))
                .andExpect(jsonPath("$.data.session.summary").value("Bạn hiểu bài khá tốt."))
                .andExpect(jsonPath("$.data.credit.charged").value(1));

        // đã đóng: không nhận thêm câu trả lời
        answerText(user, lesson, session, "More.").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AI_CHAT_NOT_ACTIVE"));
    }

    @Test
    void finishBeforeAnyAnswer_isRejected_AC_AI_05() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = startSession(user, lesson);

        finish(user, lesson, session).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AI_CHAT_FINISH_TOO_EARLY"));

        verify(ai, never()).summarize(any(), any());
        assertThat(statusOf(session)).isEqualTo("active");
    }

    @Test
    void fifthAnswer_endsTheSessionWithSummaryAndNoSixthQuestion_AC_AI_05() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = startSession(user, lesson);
        for (int i = 1; i <= 4; i++) {
            answerText(user, lesson, session, "Answer " + i).andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.session.status").value("active"));
        }

        answerText(user, lesson, session, "Answer 5")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.session.status").value("completed"))
                .andExpect(jsonPath("$.data.session.answered").value(5))
                .andExpect(jsonPath("$.data.session.summary").value("Bạn hiểu bài khá tốt."))
                .andExpect(jsonPath("$.data.session.messages.length()").value(10)); // 5 câu hỏi + 5 câu trả lời

        ArgumentCaptor<Boolean> finalTurn = ArgumentCaptor.forClass(Boolean.class);
        verify(ai, times(5)).reply(any(), any(), any(), finalTurn.capture());
        assertThat(finalTurn.getAllValues()).containsExactly(false, false, false, false, true);
    }

    @Test
    void answerAfter15Minutes_isNotAcceptedAndTheSessionEndsWithSummary_AC_AI_05() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = startSession(user, lesson);
        answerText(user, lesson, session, "A man.").andExpect(status().isOk());
        backdate(session, 15 * 60 + 1);

        answerText(user, lesson, session, "Too late.")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.expired").value(true))
                .andExpect(jsonPath("$.data.session.status").value("completed"))
                .andExpect(jsonPath("$.data.session.summary").value("Bạn hiểu bài khá tốt."))
                .andExpect(jsonPath("$.data.session.answered").value(1));
        verify(ai, times(1)).reply(any(), any(), any(), anyBoolean());
    }

    // ── AC-AI-06 ───────────────────────────────────────────────────────────────────

    @Test
    void history_isFreeAndPrivateToTheOwner_AC_AI_06() throws Exception {
        UUID owner = newUser();
        UUID other = newUser();
        UUID lesson = lesson(false);
        UUID session = startSession(owner, lesson);
        int before = balance(owner);

        mockMvc.perform(get(BASE.formatted(lesson) + "/sessions/" + session).headers(auth(owner)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(session.toString()));
        assertThat(balance(owner)).isEqualTo(before);

        // người khác: xem, trả lời, gợi ý, kết thúc đều báo không tìm thấy (BR-AI-03)
        mockMvc.perform(get(BASE.formatted(lesson) + "/sessions/" + session).headers(auth(other)))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("AI_CHAT_NOT_FOUND"));
        answerText(other, lesson, session, "Hi").andExpect(status().isNotFound());
        hint(other, lesson, session).andExpect(status().isNotFound());
        finish(other, lesson, session).andExpect(status().isNotFound());
        mockMvc.perform(get(BASE.formatted(lesson) + "/sessions").headers(auth(other)))
                .andExpect(jsonPath("$.data.length()").value(0));
        // đúng phiên nhưng sai bài
        UUID otherLesson = lesson(false);
        mockMvc.perform(get(BASE.formatted(otherLesson) + "/sessions/" + session).headers(auth(owner)))
                .andExpect(status().isNotFound());
    }

    // ── AC-AI-07 ───────────────────────────────────────────────────────────────────

    @Test
    void start_isRejectedWhenBalanceIsBelowTheMinimum_AC_AI_07() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        TestData.setCredits(jdbc, user, 4);

        start(user, lesson).andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("QUOTA_EXCEEDED"));

        verify(ai, never()).open(any());
        assertThat(count("ai_conversations WHERE user_id = ?", user)).isZero();
        assertThat(balance(user)).isEqualTo(4);
    }

    @Test
    void start_isAllowedAtTheMinimumBalance_AC_AI_07() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        TestData.setCredits(jdbc, user, 5);

        start(user, lesson).andExpect(status().isOk()).andExpect(jsonPath("$.data.credit.balance.balance").value(4));
    }

    // ── AC-AI-08 ───────────────────────────────────────────────────────────────────

    @Test
    void proStudent_usesThePlanCreditsWithoutALimitOnSessions_AC_AI_08() throws Exception {
        UUID user = newUser();
        TestData.grantPro(jdbc, user, 1);
        UUID lesson = lesson(true);

        for (int i = 0; i < 4; i++) {
            start(user, lesson).andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.credit.balance.kind").value("pro"));
        }
        assertThat(count("ai_conversations WHERE user_id = ?", user)).isEqualTo(4);
        assertThat(balance(user)).isEqualTo(TestData.PRO_CREDITS_PER_MONTH - 4);
    }

    // ── AC-AI-09 ───────────────────────────────────────────────────────────────────

    @Test
    void proLesson_isRejectedForFreeStudent_AC_AI_09() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(true);

        start(user, lesson).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));

        verify(ai, never()).open(any());
        assertThat(count("ai_conversations WHERE user_id = ?", user)).isZero();
    }

    @Test
    void lessonThatIsDraftOrDeleted_isNotFound_AC_AI_01() throws Exception {
        UUID user = newUser();
        UUID topic = fixtures.topic("Topic " + tag + UUID.randomUUID());
        UUID draft = fixtures.lesson(topic, "Draft " + tag, false, "draft", "B1", 0, false);
        UUID deleted = fixtures.lesson(topic, "Deleted " + tag, false, "published", "B1", 0, true);

        start(user, draft).andExpect(status().isNotFound());
        start(user, deleted).andExpect(status().isNotFound());
        start(user, UUID.randomUUID()).andExpect(status().isNotFound());
    }

    // ── AC-AI-10 ───────────────────────────────────────────────────────────────────

    @Test
    void emptyOrOversizedAnswer_isRejectedWithoutCountingTheTurn_AC_AI_10() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = startSession(user, lesson);
        int before = balance(user);

        answerText(user, lesson, session, "   ").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AI_CHAT_ANSWER_INVALID"));
        answerText(user, lesson, session, "x".repeat(1001)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("AI_CHAT_ANSWER_INVALID"));
        answerText(user, lesson, session, null).andExpect(status().isBadRequest());

        verify(ai, never()).reply(any(), any(), any(), anyBoolean());
        assertThat(balance(user)).isEqualTo(before);
        assertThat(count("ai_conversation_messages WHERE conversation_id = ?", session)).isEqualTo(1);

        // đúng 1000 ký tự thì nhận
        answerText(user, lesson, session, "x".repeat(1000)).andExpect(status().isOk());
        answerText(user, lesson, session, "y").andExpect(status().isOk());
    }

    // ── AC-AI-11 ───────────────────────────────────────────────────────────────────

    @Test
    void openingFailure_closesTheSessionWithErrorAndDoesNotCharge_AC_AI_11() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        when(ai.open(any())).thenThrow(new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE));

        start(user, lesson).andExpect(status().isBadGateway());

        assertThat(balance(user)).isEqualTo(20);
        assertThat(used(user)).isZero();
        assertThat(jdbc.queryForObject("SELECT status FROM ai_conversations WHERE user_id = ?", String.class, user))
                .isEqualTo("error");
        // thử lại tạo phiên mới được
        doReturn(generated("Who is talking?")).when(ai).open(any());
        start(user, lesson).andExpect(status().isOk());
        // phiên lỗi chưa có dòng hội thoại nào nên không hiện trong lịch sử
        mockMvc.perform(get(BASE.formatted(lesson) + "/sessions").headers(auth(user)))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].status").value("active"));
    }

    @Test
    void midSessionFailure_keepsTheSessionAndAllowsRetryWithoutCharging_AC_AI_11() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = startSession(user, lesson);
        int before = balance(user);
        when(ai.reply(any(), any(), any(), anyBoolean()))
                .thenThrow(new BusinessException(ErrorCode.AI_FEEDBACK_BUSY))
                .thenReturn(generated(new Reply("Tốt.", "", "Where?")));

        answerText(user, lesson, session, "A man.").andExpect(status().isServiceUnavailable());

        assertThat(balance(user)).isEqualTo(before);
        assertThat(count("ai_conversation_messages WHERE conversation_id = ?", session)).isEqualTo(1);
        assertThat(statusOf(session)).isEqualTo("active");

        answerText(user, lesson, session, "A man.").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.session.answered").value(1));
        assertThat(balance(user)).isEqualTo(before - 1);
    }

    @Test
    void summaryFailureAfterTheLastAnswer_keepsTheAnswerAndCanBeRetried_AC_AI_11() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = startSession(user, lesson);
        for (int i = 1; i <= 4; i++) {
            answerText(user, lesson, session, "Answer " + i).andExpect(status().isOk());
        }
        when(ai.summarize(any(), any())).thenThrow(new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE))
                .thenReturn(generated("Tổng kết."));

        answerText(user, lesson, session, "Answer 5").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.session.status").value("active"))
                .andExpect(jsonPath("$.data.session.answered").value(5))
                .andExpect(jsonPath("$.data.session.awaitingSummary").value(true));

        finish(user, lesson, session).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.session.status").value("completed"))
                .andExpect(jsonPath("$.data.session.summary").value("Tổng kết."));
    }

    @Test
    void staleSecondSubmit_isRejectedAndNotCharged_AC_AI_02() throws Exception {
        UUID user = newUser();
        UUID lesson = lesson(false);
        UUID session = startSession(user, lesson);
        // lần gửi thứ hai thấy câu hỏi đã được trả lời (lần đầu vừa lưu xong trong lúc nó đang chờ AI)
        when(ai.reply(any(), any(), any(), anyBoolean())).thenAnswer(invocation -> {
            jdbc.update("INSERT INTO ai_conversation_messages (conversation_id, role, content) VALUES (?, 'student', 'first')",
                    session);
            return generated(new Reply("ok", "", "Next?"));
        });
        int before = balance(user);

        answerText(user, lesson, session, "second").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("AI_CHAT_TURN_CONFLICT"));

        assertThat(balance(user)).isEqualTo(before);
    }

    @Test
    void endpoints_areForStudentsOnly_AC_AI_06() throws Exception {
        UUID lesson = lesson(false);
        mockMvc.perform(post(BASE.formatted(lesson) + "/sessions")).andExpect(status().isUnauthorized());
        UUID teacher = newUser();
        // Token phải khớp vai trò thật trong DB (quản lý tài khoản kiểm tra mỗi yêu cầu), nên đặt người dùng này là giáo viên
        jdbc.update("UPDATE users SET role = 'teacher' WHERE id = ?", teacher);
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtTokenService.issueAccessToken(teacher, Role.TEACHER, UUID.randomUUID()).token());
        mockMvc.perform(post(BASE.formatted(lesson) + "/sessions").headers(headers)).andExpect(status().isForbidden());
    }

    // ── Hỗ trợ ─────────────────────────────────────────────────────────────────────

    private ResultActions start(UUID user, UUID lesson) throws Exception {
        return mockMvc.perform(post(BASE.formatted(lesson) + "/sessions").headers(auth(user)));
    }

    private UUID startSession(UUID user, UUID lesson) throws Exception {
        String body = start(user, lesson).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return UUID.fromString(com.jayway.jsonpath.JsonPath.read(body, "$.data.session.id"));
    }

    private ResultActions answerText(UUID user, UUID lesson, UUID session, String text) throws Exception {
        String body = text == null ? "{}" : "{\"text\": " + new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(text) + "}";
        return mockMvc.perform(post(BASE.formatted(lesson) + "/sessions/" + session + "/answers")
                .contentType(MediaType.APPLICATION_JSON).content(body).headers(auth(user)));
    }

    private ResultActions hint(UUID user, UUID lesson, UUID session) throws Exception {
        return mockMvc.perform(post(BASE.formatted(lesson) + "/sessions/" + session + "/hint").headers(auth(user)));
    }

    private ResultActions finish(UUID user, UUID lesson, UUID session) throws Exception {
        return mockMvc.perform(post(BASE.formatted(lesson) + "/sessions/" + session + "/finish").headers(auth(user)));
    }

    private HttpHeaders auth(UUID user) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtTokenService.issueAccessToken(user, Role.STUDENT, UUID.randomUUID()).token());
        return headers;
    }

    private UUID newUser() {
        return userAccountService.createLocal("chat-" + UUID.randomUUID() + "@x.com", "Chat", "h").id();
    }

    private UUID lesson(boolean pro) {
        UUID topic = fixtures.topic("Chat topic " + UUID.randomUUID());
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
