package com.lingualoop.backend.tutor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.lingualoop.backend.TestcontainersConfiguration;
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
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment.ErrorType;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment.PhonemeResult;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment.WordResult;
import com.lingualoop.backend.shadowing.azure.PronunciationScoringService;
import com.lingualoop.backend.subscription.service.UsageService;
import com.lingualoop.backend.support.WavFixtures;
import com.lingualoop.backend.user.service.ConsentService;
import com.lingualoop.backend.user.service.UserAccountService;

/** UC-TUTOR-04 đến 08: bắt đầu và trừ lượt, đổi từ, Lượt chấm, lạc đề, kết thúc, xem phiên, dọn phiên treo. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class TutorSessionLifecycleIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private TutorSessionService sessionService;
    @Autowired private UsageService usageService;
    @Autowired private TutorSessionCleanup cleanup;
    @Autowired private TopicRepository topics;
    @Autowired private LessonRepository lessons;
    @Autowired private SentenceRepository sentences;
    @Autowired private JdbcTemplate jdbc;

    @MockitoBean private ConsentService consent;
    @MockitoBean private LiveTokenIssuer tokenIssuer;
    @MockitoBean private PronunciationScoringService scoring;

    private int order;

    @BeforeEach
    void defaults() {
        when(consent.hasConsent(any(), any())).thenReturn(true);
        when(tokenIssuer.issue(any())).thenReturn(
                new LiveTokenIssuer.LiveToken("tok", "live-model", Instant.parse("2026-10-21T10:00:00Z")));
    }

    // ── UC-TUTOR-04 ─────────────────────────────────────────────────────────────────

    @Test
    void started_chargesOnceEvenWhenCalledAgain_AC_TUTOR_12() throws Exception {
        S s = open("Think about it", word("think", 45, "θ", 20));

        started(s).andExpect(status().isOk());
        started(s).andExpect(status().isOk());

        assertThat(used(s.user, "ai_energy")).isEqualTo(3);
        assertThat(count("tutor_sessions WHERE id = ? AND started_at IS NOT NULL AND charged", s.id)).isEqualTo(1);
    }

    @Test
    void aSessionThatNeverStartedEndsAsConnectFailedWithoutCharge_AC_TUTOR_13() throws Exception {
        S s = open("Think about it", word("think", 45, "θ", 20));
        jdbc.update("UPDATE tutor_sessions SET created_at = now() - interval '20 seconds' WHERE id = ?", s.id);

        mockMvc.perform(get("/api/v1/tutor/sessions/{id}", s.id).headers(auth(s.user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.outcome").value("connect_failed"));

        assertThat(used(s.user, "ai_energy")).isZero();
        started(s).andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("TUTOR_SESSION_CONFLICT"));
        assertThat(used(s.user, "ai_energy")).isZero();
    }

    @Test
    void theCleanupJobClosesStaleUnstartedSessionsOnly() throws Exception {
        S stale = open("Think about it", word("think", 45, "θ", 20));
        S fresh = open("Think again", word("think", 45, "θ", 20));
        S started = open("Think once", word("think", 45, "θ", 20));
        started(started).andExpect(status().isOk());
        jdbc.update("UPDATE tutor_sessions SET created_at = now() - interval '1 minute' WHERE id IN (?, ?)", stale.id, started.id);

        int ended = cleanup.sweep();

        assertThat(ended).isGreaterThanOrEqualTo(1);
        assertThat(outcome(stale)).isEqualTo("connect_failed");
        assertThat(outcome(fresh)).isNull();
        assertThat(outcome(started)).isNull();
        assertThat(cleanup.sweep()).isZero(); // đã dọn thì không dọn lại
    }

    @Test
    void theCleanupJobAlsoClosesStartedSessionsPastTheMaxPlusGrace() throws Exception {
        S overdue = startedSession("Think about it", word("think", 45, "θ", 20));
        S withinGrace = startedSession("Think again", word("think", 45, "θ", 20));
        jdbc.update("UPDATE tutor_sessions SET started_at = now() - interval '631 seconds' WHERE id = ?", overdue.id);
        jdbc.update("UPDATE tutor_sessions SET started_at = now() - interval '620 seconds' WHERE id = ?", withinGrace.id);

        assertThat(cleanup.sweep()).isGreaterThanOrEqualTo(1);

        assertThat(outcome(overdue)).isEqualTo("timeout");
        assertThat(outcome(withinGrace)).isNull();
        assertThat(count("tutor_sessions WHERE id = ? AND charged", overdue.id)).isEqualTo(1); // đã trừ lượt thì giữ nguyên
        assertThat(cleanup.sweep()).isZero();
    }

    @Test
    void afterTheMaxPlusGraceEveryRequestIsRefusedBeforeAnyAzureCallAndRepeatsKeepTheSameOutcome() throws Exception {
        S s = startedSession("Think about it", word("think", 45, "θ", 20), word("about", 90, "ə", 90));
        assessWord("think", "θ", 90);
        jdbc.update("UPDATE tutor_sessions SET started_at = now() - interval '631 seconds' WHERE id = ?", s.id);

        for (int i = 0; i < 2; i++) { // gọi lại sau khi đã hết giờ vẫn là 409, không gọi Azure
            attempt(s, "word").andExpect(status().isConflict()).andExpect(jsonPath("$.code").value("TUTOR_SESSION_CONFLICT"));
            attempt(s, "sentence").andExpect(status().isConflict());
            switchWord(s, "about").andExpect(status().isConflict());
            event(s, topic("off_topic")).andExpect(status().isConflict());
        }

        verify(scoring, never()).assess(any(), any());
        assertThat(outcome(s)).isEqualTo("timeout");
        event(s, "{\"type\":\"end\",\"outcome\":\"learner_exit\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.outcome").value("timeout")); // kết quả đầu tiên được giữ
    }

    @Test
    void aSessionStillInsideTheGraceKeepsWorking() throws Exception {
        S s = startedSession("Think about it", word("think", 45, "θ", 20));
        assessWord("think", "θ", 90);
        jdbc.update("UPDATE tutor_sessions SET started_at = now() - interval '620 seconds' WHERE id = ?", s.id);

        attempt(s, "word").andExpect(status().isOk());
    }

    @Test
    void quotaUsedUpBetweenCreateAndStart_endsTheSessionAndAnswersQuotaExceeded_AC_TUTOR_14() throws Exception {
        UUID user = newUser();
        usageService.tryConsume(user, "ai_energy", 5); // còn 3 năng lượng: vừa đủ một phiên gia sư
        S first = open(user, "Think about it", word("think", 45, "θ", 20));
        S second = open(user, "Think again", word("think", 45, "θ", 20)); // hai tab: cả hai tạo được lúc còn đủ năng lượng
        started(first).andExpect(status().isOk());

        started(second).andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("QUOTA_EXCEEDED"))
                .andExpect(jsonPath("$.details.feature").value("ai_energy"))
                .andExpect(jsonPath("$.details.action").value("tutor_session"));

        assertThat(outcome(second)).isEqualTo("connect_failed");
        assertThat(used(user, "ai_energy")).isEqualTo(8);
    }

    // ── UC-TUTOR-05 ─────────────────────────────────────────────────────────────────

    @Test
    void switchWord_addsAWordFromTheSentenceAndIgnoresCaseAndPunctuation_AC_TUTOR_15() throws Exception {
        S s = startedSession("Think about it", word("think", 45, "θ", 20), word("about", 90, "ə", 90));

        switchWord(s, "About,").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.currentWord.word").value("about"))
                .andExpect(jsonPath("$.data.attemptsLeft").value(3))
                .andExpect(jsonPath("$.data.instruction").isNotEmpty())
                .andExpect(jsonPath("$.data.words.length()").value(2));

        assertThat(count("tutor_session_words WHERE session_id = ?", s.id)).isEqualTo(2);
        assertThat(jdbc.queryForObject("SELECT current_word_key FROM tutor_sessions WHERE id = ?", String.class, s.id))
                .isEqualTo("about");
    }

    @Test
    void switchWord_toAWordOutsideTheSentenceChangesNothing_AC_TUTOR_16() throws Exception {
        S s = startedSession("Think about it", word("think", 45, "θ", 20));

        switchWord(s, "banana").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("TUTOR_WORD_NOT_IN_SENTENCE"))
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("think, about, it")));

        assertThat(jdbc.queryForObject("SELECT current_word_key FROM tutor_sessions WHERE id = ?", String.class, s.id))
                .isEqualTo("think");
    }

    @Test
    void switchWord_onAnEndedSessionIsAConflict_AC_TUTOR_17() throws Exception {
        S s = startedSession("Think about it", word("think", 45, "θ", 20));
        event(s, "{\"type\":\"end\",\"outcome\":\"learner_exit\"}").andExpect(status().isOk());

        switchWord(s, "think").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TUTOR_SESSION_CONFLICT"));
    }

    // ── UC-TUTOR-06 ─────────────────────────────────────────────────────────────────

    @Test
    void attempt_passingMovesToTheNextWordAndStoresTheScoreAfter_AC_TUTOR_18() throws Exception {
        S s = startedSession("Think this", word("think", 45, "θ", 20), word("this", 50, "ð", 30));
        assessWord("think", "θ", 90);

        attempt(s, "word").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.attemptNumber").value(1))
                .andExpect(jsonPath("$.data.score").value(90.0))
                .andExpect(jsonPath("$.data.passed").value(true))
                .andExpect(jsonPath("$.data.wordStatus").value("passed"))
                .andExpect(jsonPath("$.data.nextStep").value("next_word"))
                .andExpect(jsonPath("$.data.nextWord").value("this"))
                .andExpect(jsonPath("$.data.instruction").isNotEmpty());

        assertThat(jdbc.queryForMap("SELECT status, score_after FROM tutor_session_words WHERE session_id = ? AND word_key = 'think'", s.id))
                .containsEntry("status", "passed").containsEntry("score_after", new java.math.BigDecimal("90.00"));
        assertThat(jdbc.queryForObject("SELECT current_word_key FROM tutor_sessions WHERE id = ?", String.class, s.id))
                .isEqualTo("this");
    }

    @Test
    void attempt_aConsonantStillReportedAsAnotherOneCannotPass_BR_TUTOR_01() throws Exception {
        // Câu có phiên âm mẫu /ɪf/; đọc lại vẫn ra "iv": Azure chấm 100 nhưng âm đích /f/ vẫn sai
        S s = startedSession("if", "ɪf", word("if", 100, "ɪ", 100, "v", 100));
        jdbc.update("UPDATE tutor_session_words SET focus_phoneme_id = (SELECT id FROM phonemes WHERE symbol = 'f') "
                + "WHERE session_id = ?", s.id);
        when(scoring.assess(any(), eq("if"))).thenReturn(new PronunciationAssessment("if", 100, 100, 100, 100, null,
                List.of(new WordResult("if", 100, ErrorType.NONE, List.of(new PhonemeResult("ɪ", 100), new PhonemeResult("v", 100))))));

        attempt(s, "word").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.passed").value(false))
                .andExpect(jsonPath("$.data.score").value(59.0))
                .andExpect(jsonPath("$.data.nextStep").value("retry_word"));
    }

    @Test
    void attempt_afterThreeFailuresTheWordNeedsPracticeAndComingBackGivesNewAttempts_AC_TUTOR_19() throws Exception {
        S s = startedSession("Think about it", word("think", 45, "θ", 20), word("about", 90, "ə", 90));
        assessWord("think", "θ", 50);

        attempt(s, "word").andExpect(jsonPath("$.data.nextStep").value("retry_word"));
        attempt(s, "word").andExpect(jsonPath("$.data.nextStep").value("retry_word"));
        // "about" đọc tốt nên không nằm trong danh sách từ lỗi; sau 3 lượt hết danh sách thì mời đọc cả câu
        attempt(s, "word").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.attemptNumber").value(3))
                .andExpect(jsonPath("$.data.wordStatus").value("needs_practice"))
                .andExpect(jsonPath("$.data.nextStep").value("sentence"));
        attempt(s, "word").andExpect(status().isConflict()).andExpect(jsonPath("$.message").value(
                org.hamcrest.Matchers.containsString("hết 3 lượt")));

        switchWord(s, "think").andExpect(status().isOk()).andExpect(jsonPath("$.data.attemptsLeft").value(3));
        attempt(s, "word").andExpect(status().isOk()).andExpect(jsonPath("$.data.attemptNumber").value(1));
    }

    @Test
    void attempt_theWholeSentenceEndsTheSessionAndLeavesTheOriginalScoreAlone_AC_TUTOR_20_21() throws Exception {
        S s = startedSession("Think about it", word("think", 45, "θ", 20));
        assessWord("think", "θ", 90);
        attempt(s, "word").andExpect(jsonPath("$.data.nextStep").value("sentence"));
        when(scoring.assess(any(), eq("Think about it"))).thenReturn(new PronunciationAssessment("think about it", 85, 84, 90, 100, null, List.of()));

        attempt(s, "sentence").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.target").value("sentence"))
                .andExpect(jsonPath("$.data.score").value(85.0))
                .andExpect(jsonPath("$.data.nextStep").value("end"))
                .andExpect(jsonPath("$.data.outcome").value("completed"));

        assertThat(outcome(s)).isEqualTo("completed");
        assertThat(jdbc.queryForObject("SELECT score FROM sentence_attempts WHERE id = ?", Double.class, s.attempt)).isEqualTo(70.0);
        assertThat(count("sentence_attempts WHERE user_id = ?", s.user)).isEqualTo(1); // không tạo Lượt shadowing mới
        // chỉ có 3 năng lượng của chính phiên gia sư; lượt chấm trong phiên không tốn thêm
        assertThat(used(s.user, "ai_energy")).isEqualTo(3);
    }

    @Test
    void attempt_whenAzureCannotScore_isNotCountedAndTheTutorGetsAnInstruction_AC_TUTOR_22() throws Exception {
        S s = startedSession("Think about it", word("think", 45, "θ", 20));
        when(scoring.assess(any(), any())).thenThrow(new BusinessException(ErrorCode.SHADOWING_NO_SPEECH));

        attempt(s, "word").andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("SHADOWING_NO_SPEECH"))
                .andExpect(jsonPath("$.details.instruction").value(org.hamcrest.Matchers.containsString("không bị tính")));

        assertThat(jdbc.queryForMap("SELECT attempts, total_attempts FROM tutor_session_words WHERE session_id = ?", s.id))
                .containsEntry("attempts", 0).containsEntry("total_attempts", 0);
    }

    @Test
    void attempt_whenTheWordChangesWhileAzureIsScoring_isNotCounted_AC_TUTOR_23() throws Exception {
        S s = startedSession("Think about it", word("think", 45, "θ", 20), word("about", 90, "ə", 90));
        when(scoring.assess(any(), eq("think"))).thenAnswer(invocation -> {
            sessionService.switchWord(s.user, s.id, "about"); // học viên đổi từ trong lúc Azure chấm
            return word("think", "θ", 90);
        });

        attempt(s, "word").andExpect(status().isConflict())
                .andExpect(jsonPath("$.message").value(org.hamcrest.Matchers.containsString("đã đổi")));

        assertThat(jdbc.queryForObject("SELECT total_attempts FROM tutor_session_words WHERE session_id = ? AND word_key = 'think'",
                Integer.class, s.id)).isZero();
    }

    @Test
    void attempt_withoutStartingOrConsentOrValidAudio_isRefused() throws Exception {
        S s = open("Think about it", word("think", 45, "θ", 20));
        assessWord("think", "θ", 90);

        attempt(s, "word").andExpect(status().isConflict()); // chưa started

        started(s).andExpect(status().isOk());
        mockMvc.perform(multipart("/api/v1/tutor/sessions/{id}/attempts", s.id)
                        .file(new MockMultipartFile("audio", "a.wav", "audio/wav", new byte[] {1, 2, 3}))
                        .param("target", "word").headers(auth(s.user)))
                .andExpect(status().isBadRequest()).andExpect(jsonPath("$.code").value("SHADOWING_AUDIO_INVALID"));
        mockMvc.perform(multipart("/api/v1/tutor/sessions/{id}/attempts", s.id)
                        .file(new MockMultipartFile("audio", "a.wav", "audio/wav", WavFixtures.valid(1_000)))
                        .param("target", "paragraph").headers(auth(s.user)))
                .andExpect(status().isBadRequest());

        when(consent.hasConsent(any(), any())).thenReturn(false);
        attempt(s, "word").andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("AI_CONSENT_REQUIRED"));
    }

    // ── UC-TUTOR-07 / 08 ────────────────────────────────────────────────────────────

    @Test
    void offTopicTurnsEscalateAndEndTheSessionOnTheThird_AC_TUTOR_24() throws Exception {
        S s = startedSession("Think about it", word("think", 45, "θ", 20));

        event(s, topic("off_topic")).andExpect(jsonPath("$.data.offTopicStreak").value(1))
                .andExpect(jsonPath("$.data.ended").value(false));
        event(s, topic("off_topic")).andExpect(jsonPath("$.data.offTopicStreak").value(2))
                .andExpect(jsonPath("$.data.ended").value(false));
        event(s, topic("off_topic")).andExpect(jsonPath("$.data.offTopicStreak").value(3))
                .andExpect(jsonPath("$.data.ended").value(true))
                .andExpect(jsonPath("$.data.outcome").value("off_topic"));

        assertThat(outcome(s)).isEqualTo("off_topic");
    }

    @Test
    void anOnTopicTurnResetsTheStreak_AC_TUTOR_25() throws Exception {
        S s = startedSession("Think about it", word("think", 45, "θ", 20));

        event(s, topic("off_topic"));
        event(s, topic("off_topic"));
        event(s, topic("on_topic")).andExpect(jsonPath("$.data.offTopicStreak").value(0));
        event(s, topic("off_topic")).andExpect(jsonPath("$.data.offTopicStreak").value(1))
                .andExpect(jsonPath("$.data.ended").value(false));

        assertThat(outcome(s)).isNull();
        event(s, "{\"type\":\"topic\",\"topic\":\"banana\"}").andExpect(status().isBadRequest());
        event(s, "{\"type\":\"nope\"}").andExpect(status().isBadRequest());
    }

    @Test
    void end_keepsTheFirstOutcomeAndNeverTrustsACompletedClaim_AC_TUTOR_26_27() throws Exception {
        S s = startedSession("Think about it", word("think", 45, "θ", 20));

        event(s, "{\"type\":\"end\",\"outcome\":\"completed\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.outcome").value("learner_exit"));
        event(s, "{\"type\":\"end\",\"outcome\":\"idle\"}").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.outcome").value("learner_exit"));

        assertThat(outcome(s)).isEqualTo("learner_exit");
        S idle = startedSession("Think again", word("think", 45, "θ", 20));
        event(idle, "{\"type\":\"end\",\"outcome\":\"idle\"}").andExpect(jsonPath("$.data.outcome").value("idle"));
    }

    @Test
    void get_returnsProgressAndBeforeAfterScoresAndHidesTheSessionFromOthers_AC_TUTOR_28() throws Exception {
        S s = startedSession("Think about it", word("think", 45, "θ", 20));
        assessWord("think", "θ", 90);
        attempt(s, "word").andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/tutor/sessions/{id}", s.id).headers(auth(s.user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.charged").value(true))
                .andExpect(jsonPath("$.data.words[0].word").value("think"))
                .andExpect(jsonPath("$.data.words[0].baseline").value(20.0))
                .andExpect(jsonPath("$.data.words[0].best").value(90.0))
                .andExpect(jsonPath("$.data.words[0].status").value("passed"));
        mockMvc.perform(get("/api/v1/tutor/sessions/{id}", s.id).headers(auth(newUser())))
                .andExpect(status().isNotFound());
    }

    // ── helpers ─────────────────────────────────────────────────────────────────────

    private record S(UUID user, UUID id, long attempt) {
    }

    private record W(String text, double accuracy, Object[] phonemes) {
    }

    private static W word(String text, double accuracy, Object... symbolsAndScores) {
        return new W(text, accuracy, symbolsAndScores);
    }

    private void assessWord(String text, String phoneme, double score) {
        when(scoring.assess(any(), eq(text))).thenReturn(word(text, phoneme, score));
    }

    private static PronunciationAssessment word(String text, String phoneme, double score) {
        return new PronunciationAssessment(text, score, score, 100, 100, null, List.of(
                new WordResult(text, score, ErrorType.NONE, List.of(new PhonemeResult(phoneme, score)))));
    }

    private S startedSession(String text, W... words) throws Exception {
        S s = open(text, words);
        started(s).andExpect(status().isOk());
        return s;
    }

    private S startedSession(String text, String ipa, W... words) throws Exception {
        S s = open(newUser(), text, ipa, words);
        started(s).andExpect(status().isOk());
        return s;
    }

    private S open(String text, W... words) throws Exception {
        return open(newUser(), text, words);
    }

    private S open(UUID user, String text, W... words) throws Exception {
        return open(user, text, null, words);
    }

    /** Lưu một Lượt shadowing đã chấm rồi tạo phiên qua API (Gemini là bản giả). */
    private S open(UUID user, String text, String ipa, W... words) throws Exception {
        Topic topic = new Topic();
        topic.setSlug("tl-t-" + UUID.randomUUID().toString().substring(0, 8));
        topic.setName("tutor topic");
        topic = topics.save(topic);
        Lesson lesson = new Lesson();
        lesson.setTopic(topic);
        lesson.setSlug("tl-" + UUID.randomUUID().toString().substring(0, 8));
        lesson.setTitle("tutor lifecycle");
        lesson.setDifficulty(CefrLevel.B1);
        lesson.setPro(false);
        lesson.setStatus(LessonStatus.APPROVED);
        lesson = lessons.save(lesson);
        Sentence sentence = new Sentence();
        sentence.setLesson(lesson);
        sentence.setSortOrder(order++);
        sentence.setText(text);
        sentence.setIpa(ipa);
        sentence.setStartMs(0);
        sentence.setEndMs(900);
        sentence.setCefrLevel(CefrLevel.A1);
        sentence = sentences.save(sentence);

        long attempt = jdbc.queryForObject("INSERT INTO sentence_attempts (user_id, sentence_id, mode, provider, score, accuracy_score) "
                + "VALUES (?, ?, 'shadowing', 'azure', 70, 70) RETURNING id", Long.class, user, sentence.getId());
        int pos = 0;
        for (W w : words) {
            long wordId = jdbc.queryForObject("INSERT INTO sentence_attempt_words (attempt_id, position, expected_word, actual_word, "
                    + "outcome, accuracy_score) VALUES (?, ?, ?, ?, ?, ?) RETURNING id", Long.class, attempt, pos++,
                    w.text, w.text, w.accuracy < 60 ? "mispronounced" : "correct", w.accuracy);
            for (int i = 0; i < w.phonemes.length; i += 2) {
                jdbc.update("INSERT INTO sentence_attempt_phonemes (attempt_word_id, position, phoneme_id, accuracy_score) "
                        + "VALUES (?, ?, (SELECT id FROM phonemes WHERE symbol = ?), ?)", wordId, i / 2,
                        w.phonemes[i], ((Number) w.phonemes[i + 1]).doubleValue());
            }
        }
        mockMvc.perform(post("/api/v1/tutor/sessions").headers(auth(user)).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"attemptId\":" + attempt + "}"))
                .andExpect(status().isOk());
        UUID id = jdbc.queryForObject("SELECT id FROM tutor_sessions WHERE attempt_id = ? ORDER BY created_at DESC LIMIT 1",
                UUID.class, attempt);
        return new S(user, id, attempt);
    }

    private ResultActions started(S s) throws Exception {
        return mockMvc.perform(post("/api/v1/tutor/sessions/{id}/started", s.id).headers(auth(s.user)));
    }

    private ResultActions switchWord(S s, String word) throws Exception {
        return mockMvc.perform(post("/api/v1/tutor/sessions/{id}/word", s.id).headers(auth(s.user))
                .contentType(MediaType.APPLICATION_JSON).content("{\"word\":\"" + word + "\"}"));
    }

    private ResultActions attempt(S s, String target) throws Exception {
        return mockMvc.perform(multipart("/api/v1/tutor/sessions/{id}/attempts", s.id)
                .file(new MockMultipartFile("audio", "a.wav", "audio/wav", WavFixtures.valid(1_000)))
                .param("target", target).headers(auth(s.user)));
    }

    private ResultActions event(S s, String body) throws Exception {
        return mockMvc.perform(post("/api/v1/tutor/sessions/{id}/events", s.id).headers(auth(s.user))
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private static String topic(String topic) {
        return "{\"type\":\"topic\",\"topic\":\"" + topic + "\"}";
    }

    private String outcome(S s) {
        return jdbc.queryForObject("SELECT outcome FROM tutor_sessions WHERE id = ?", String.class, s.id);
    }

    private int used(UUID user, String feature) {
        Integer n = jdbc.queryForObject("SELECT coalesce(sum(used), 0) FROM usage_counters WHERE user_id = ? AND feature = ?",
                Integer.class, user, feature);
        return n == null ? 0 : n;
    }

    private int count(String fromWhere, Object... args) {
        return jdbc.queryForObject("SELECT count(*) FROM " + fromWhere, Integer.class, args);
    }

    private HttpHeaders auth(UUID user) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtTokenService.issueAccessToken(user, Role.STUDENT, UUID.randomUUID()).token());
        return headers;
    }

    private UUID newUser() {
        return userAccountService.createLocal("tl-" + UUID.randomUUID() + "@x.com", "Tl", "t").id();
    }
}
