package com.lingualoop.backend.tutor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
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

import com.lingualoop.backend.TestcontainersConfiguration;
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
import com.lingualoop.backend.subscription.service.UsageService;
import com.lingualoop.backend.user.service.ConsentService;
import com.lingualoop.backend.user.service.UserAccountService;

/** UC-TUTOR-01 đến 03: xét lời mời, từ chối, tạo phiên (Gemini Live và consent là bản giả). */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class TutorOfferAndSessionIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private UsageService usageService;
    @Autowired private TopicRepository topics;
    @Autowired private LessonRepository lessons;
    @Autowired private SentenceRepository sentences;
    @Autowired private JdbcTemplate jdbc;

    @MockitoBean private ConsentService consent;
    @MockitoBean private LiveTokenIssuer tokenIssuer;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);
    private int order;

    @BeforeEach
    void defaults() {
        when(consent.hasConsent(any(), any())).thenReturn(true);
        when(tokenIssuer.issue(any())).thenReturn(
                new LiveTokenIssuer.LiveToken("tok-123", "live-model", Instant.parse("2026-10-21T10:00:00Z")));
    }

    // ── UC-TUTOR-01 ─────────────────────────────────────────────────────────────────

    @Test
    void offer_whenAWordScoresBelow60_offersWithTheWordList_AC_TUTOR_01() throws Exception {
        Fx f = fx();
        long attempt = attempt(f, "Think about it", word("think", 45, "θ", 20, "ɪ", 80));

        offer(f.user, attempt)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.offer").value(true))
                .andExpect(jsonPath("$.data.reason").value("LOW_WORD_SCORE"))
                .andExpect(jsonPath("$.data.offerId").isNotEmpty())
                .andExpect(jsonPath("$.data.words[0].word").value("think"))
                .andExpect(jsonPath("$.data.words[0].phoneme").value("θ"))
                .andExpect(jsonPath("$.data.words[0].tipVi").isNotEmpty());

        assertThat(count("tutor_offers WHERE user_id = ?", f.user)).isEqualTo(1);
    }

    @Test
    void offer_whenTheSameTargetPhonemeFailsAgain_offersEvenWithoutALowWord_AC_TUTOR_02() throws Exception {
        Fx f = fx();
        attempt(f, "Think about it", word("think", 70, "θ", 40, "ɪ", 90));
        long current = attempt(f, "Thanks a lot", word("thanks", 72, "θ", 45, "æ", 90));

        offer(f.user, current)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.offer").value(true))
                .andExpect(jsonPath("$.data.reason").value("REPEATED_PHONEME_ERROR"));
    }

    @Test
    void offer_whenTheSentenceIsGood_doesNotOfferAndStoresNothing_AC_TUTOR_03() throws Exception {
        Fx f = fx();
        long attempt = attempt(f, "Good job", word("good", 95, "g", 95, "ʊ", 94));

        offer(f.user, attempt)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.offer").value(false))
                .andExpect(jsonPath("$.data.reason").value("NO_SIGNIFICANT_ERROR"));

        assertThat(count("tutor_offers WHERE user_id = ?", f.user)).isZero();
    }

    @Test
    void offer_waitsThreeAttemptsBetweenOffers_AC_TUTOR_04() throws Exception {
        Fx f = fx();
        long first = attempt(f, "Think about it", word("think", 45, "θ", 20));
        offer(f.user, first).andExpect(jsonPath("$.data.offer").value(true));

        long second = attempt(f, "Think again", word("think", 45, "θ", 20));
        offer(f.user, second).andExpect(jsonPath("$.data.reason").value("COOLDOWN"))
                .andExpect(jsonPath("$.data.offer").value(false));
        long third = attempt(f, "Think once", word("think", 45, "θ", 20));
        offer(f.user, third).andExpect(jsonPath("$.data.reason").value("COOLDOWN"));
        long fourth = attempt(f, "Think more", word("think", 45, "θ", 20));
        offer(f.user, fourth).andExpect(jsonPath("$.data.offer").value(true));
    }

    @Test
    void offer_ofSomeoneElsesOrADictationAttempt_returns404_AC_TUTOR_05() throws Exception {
        Fx f = fx();
        long attempt = attempt(f, "Think about it", word("think", 45, "θ", 20));
        UUID stranger = newUser();
        UUID sentence = jdbc.queryForObject("SELECT sentence_id FROM sentence_attempts WHERE id = ?", UUID.class, attempt);
        long dictation = jdbc.queryForObject("INSERT INTO sentence_attempts (user_id, sentence_id, mode, submitted_text) "
                + "VALUES (?, ?, 'dictation', 'x') RETURNING id", Long.class, f.user, sentence);

        offer(stranger, attempt).andExpect(status().isNotFound());
        offer(f.user, dictation).andExpect(status().isNotFound());
        assertThat(count("tutor_offers WHERE attempt_id = ?", attempt)).isZero();
    }

    // ── UC-TUTOR-02 ─────────────────────────────────────────────────────────────────

    @Test
    void decline_marksTheOfferOnceAndRejectsOtherPeople_AC_TUTOR_06() throws Exception {
        Fx f = fx();
        long attempt = attempt(f, "Think about it", word("think", 45, "θ", 20));
        UUID offerId = UUID.fromString(jdbcOfferId(f.user, attempt));

        mockMvc.perform(post("/api/v1/tutor/offers/{id}/decline", offerId).headers(auth(newUser())))
                .andExpect(status().isNotFound());
        mockMvc.perform(post("/api/v1/tutor/offers/{id}/decline", offerId).headers(auth(f.user)))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/tutor/offers/{id}/decline", offerId).headers(auth(f.user)))
                .andExpect(status().isOk());

        assertThat(count("tutor_offers WHERE id = ? AND declined_at IS NOT NULL AND accepted_at IS NULL", offerId)).isEqualTo(1);
    }

    // ── UC-TUTOR-03 ─────────────────────────────────────────────────────────────────

    @Test
    void createSession_returnsTokenWordsAndLimits_AC_TUTOR_07() throws Exception {
        Fx f = fx();
        long attempt = attempt(f, "Think about it", word("think", 45, "θ", 20, "ɪ", 80), word("about", 90, "ə", 90));
        UUID offerId = UUID.fromString(jdbcOfferId(f.user, attempt));

        createSession(f.user, attempt, offerId)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sessionId").isNotEmpty())
                .andExpect(jsonPath("$.data.token").value("tok-123"))
                .andExpect(jsonPath("$.data.model").value("live-model"))
                .andExpect(jsonPath("$.data.words.length()").value(1))
                .andExpect(jsonPath("$.data.words[0].word").value("think"))
                .andExpect(jsonPath("$.data.words[0].phoneme").value("θ"))
                .andExpect(jsonPath("$.data.words[0].baseline").value(20.0))
                .andExpect(jsonPath("$.data.words[0].status").value("pending"))
                .andExpect(jsonPath("$.data.currentWord").value("think"))
                .andExpect(jsonPath("$.data.limits.startTimeoutSeconds").value(15))
                .andExpect(jsonPath("$.data.limits.maxAttemptsPerWord").value(3));

        assertThat(count("tutor_sessions WHERE user_id = ? AND attempt_id = ? AND started_at IS NULL AND charged = false",
                f.user, attempt)).isEqualTo(1);
        assertThat(count("tutor_session_words w JOIN tutor_sessions s ON s.id = w.session_id "
                + "JOIN phonemes p ON p.id = w.focus_phoneme_id WHERE s.user_id = ? AND p.symbol = 'θ'", f.user)).isEqualTo(1);
        assertThat(count("tutor_offers WHERE id = ? AND accepted_at IS NOT NULL", offerId)).isEqualTo(1);
        assertThat(usageOf(f.user)).isZero(); // chỉ kiểm tra hạn mức, trừ lượt khi started
    }

    @Test
    void createSession_forAGoodSentence_hasAnEmptyWordList_AC_TUTOR_08() throws Exception {
        Fx f = fx();
        long attempt = attempt(f, "Good job", word("good", 95, "g", 95, "ʊ", 94));

        createSession(f.user, attempt, null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.words.length()").value(0))
                .andExpect(jsonPath("$.data.currentWord").doesNotExist())
                .andExpect(jsonPath("$.data.token").value("tok-123"));
    }

    @Test
    void createSession_ofSomeoneElsesAttempt_returns404AndNeverIssuesAToken_AC_TUTOR_09() throws Exception {
        Fx f = fx();
        long attempt = attempt(f, "Think about it", word("think", 45, "θ", 20));

        createSession(newUser(), attempt, null).andExpect(status().isNotFound());

        verifyNoInteractions(tokenIssuer);
        assertThat(count("tutor_sessions WHERE attempt_id = ?", attempt)).isZero();
    }

    @Test
    void createSession_withoutConsentOrQuota_isRefusedBeforeAnyToken_AC_TUTOR_10() throws Exception {
        Fx f = fx();
        long attempt = attempt(f, "Think about it", word("think", 45, "θ", 20));

        when(consent.hasConsent(any(), any())).thenReturn(false);
        createSession(f.user, attempt, null)
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AI_CONSENT_REQUIRED"));

        when(consent.hasConsent(any(), any())).thenReturn(true);
        usageService.tryConsume(f.user, "tutor_session"); // Free chỉ có 1 phiên mỗi ngày
        createSession(f.user, attempt, null)
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("QUOTA_EXCEEDED"))
                .andExpect(jsonPath("$.details.feature").value("tutor_session"))
                .andExpect(jsonPath("$.details.limit").value(1));

        verifyNoInteractions(tokenIssuer);
        assertThat(count("tutor_sessions WHERE attempt_id = ?", attempt)).isZero();
    }

    @Test
    void createSession_withAnOfferOfAnotherAttempt_returns404AndLeavesTheOfferPending() throws Exception {
        Fx f = fx();
        long attemptA = attempt(f, "Think about it", word("think", 45, "θ", 20));
        long attemptB = attempt(f, "Think again", word("think", 45, "θ", 20));
        UUID offerOfA = UUID.fromString(jdbcOfferId(f.user, attemptA));

        createSession(f.user, attemptB, offerOfA).andExpect(status().isNotFound());

        assertThat(count("tutor_offers WHERE id = ? AND accepted_at IS NULL", offerOfA)).isEqualTo(1);
        assertThat(count("tutor_sessions WHERE attempt_id = ?", attemptB)).isZero();
        verifyNoInteractions(tokenIssuer);
    }

    @Test
    void createSession_afterFiveUnstartedSessionsToday_isRefusedBeforeAnyToken() throws Exception {
        Fx f = fx();
        long attempt = attempt(f, "Think about it", word("think", 45, "θ", 20));
        for (int i = 0; i < TutorThresholds.MAX_UNSTARTED_SESSIONS_PER_DAY; i++) {
            createSession(f.user, attempt, null).andExpect(status().isOk());
        }
        verify(tokenIssuer, times(TutorThresholds.MAX_UNSTARTED_SESSIONS_PER_DAY)).issue(any());

        createSession(f.user, attempt, null).andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("TUTOR_TOO_MANY_FAILED_STARTS"));

        verify(tokenIssuer, times(TutorThresholds.MAX_UNSTARTED_SESSIONS_PER_DAY)).issue(any()); // không cấp thêm token
        assertThat(count("tutor_sessions WHERE attempt_id = ?", attempt)).isEqualTo(5);
        // Phiên đã started không bị tính vào trần
        jdbc.update("UPDATE tutor_sessions SET started_at = now() WHERE attempt_id = ?", attempt);
        createSession(f.user, attempt, null).andExpect(status().isOk());
    }

    @Test
    void createSession_whenGeminiFails_answers503WithTheWordsForATextFallback_AC_TUTOR_11() throws Exception {
        Fx f = fx();
        long attempt = attempt(f, "Think about it", word("think", 45, "θ", 20));
        UUID offerId = UUID.fromString(jdbcOfferId(f.user, attempt));
        when(tokenIssuer.issue(any())).thenThrow(new IllegalStateException("Gemini quá tải"));

        createSession(f.user, attempt, offerId)
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("TUTOR_LIVE_UNAVAILABLE"))
                .andExpect(jsonPath("$.details.words[0].word").value("think"))
                .andExpect(jsonPath("$.details.words[0].tipVi").isNotEmpty());

        assertThat(count("tutor_sessions WHERE attempt_id = ?", attempt)).isZero();
        assertThat(usageOf(f.user)).isZero();
        assertThat(count("tutor_offers WHERE id = ? AND accepted_at IS NOT NULL", offerId)).isEqualTo(1);
    }

    // ── UC-TUTOR-09 ─────────────────────────────────────────────────────────────────

    @Test
    void lessonEvent_isStoredAndAnUnknownOneIsRejected_AC_TUTOR_29() throws Exception {
        Fx f = fx();
        String body = "{\"lessonId\":\"%s\",\"event\":\"%s\"}";

        mockMvc.perform(post("/api/v1/tutor/lesson-events").headers(auth(f.user)).contentType(MediaType.APPLICATION_JSON)
                        .content(body.formatted(f.lesson, "toggle_on")))
                .andExpect(status().isOk());
        mockMvc.perform(post("/api/v1/tutor/lesson-events").headers(auth(f.user)).contentType(MediaType.APPLICATION_JSON)
                        .content(body.formatted(f.lesson, "toggle_sideways")))
                .andExpect(status().isBadRequest());

        mockMvc.perform(post("/api/v1/tutor/lesson-events").headers(auth(f.user)).contentType(MediaType.APPLICATION_JSON)
                        .content(body.formatted(UUID.randomUUID(), "toggle_on")))
                .andExpect(status().isNotFound());

        assertThat(count("tutor_lesson_events WHERE user_id = ?", f.user)).isEqualTo(1);
        verify(tokenIssuer, never()).issue(any());
    }

    // ── helpers ─────────────────────────────────────────────────────────────────────

    private record Fx(UUID user, UUID lesson) {
    }

    private record W(String text, double accuracy, Object[] phonemes) {
    }

    private static W word(String text, double accuracy, Object... symbolsAndScores) {
        return new W(text, accuracy, symbolsAndScores);
    }

    private Fx fx() {
        UUID user = newUser();
        Topic topic = new Topic();
        topic.setSlug("tu-t-" + UUID.randomUUID().toString().substring(0, 8));
        topic.setName("tutor topic");
        topic = topics.save(topic);
        Lesson l = new Lesson();
        l.setTopic(topic);
        l.setSlug("tu-" + UUID.randomUUID().toString().substring(0, 8));
        l.setTitle("tutor " + tag);
        l.setDifficulty(CefrLevel.B1);
        l.setPro(false);
        l.setStatus(LessonStatus.APPROVED);
        l = lessons.save(l);
        return new Fx(user, l.getId());
    }

    /** Lưu một Lượt shadowing như đã chấm: từng từ và âm (không có phiên âm câu nên âm đích là âm Azure báo). */
    private long attempt(Fx f, String text, W... words) {
        Sentence s = new Sentence();
        s.setLesson(lessons.findById(f.lesson).orElseThrow());
        s.setSortOrder(order++);
        s.setText(text);
        s.setStartMs(0);
        s.setEndMs(900);
        s.setCefrLevel(CefrLevel.A1);
        s = sentences.save(s);
        long attempt = jdbc.queryForObject("INSERT INTO sentence_attempts (user_id, sentence_id, mode, provider, score, accuracy_score) "
                + "VALUES (?, ?, 'shadowing', 'azure', 70, 70) RETURNING id", Long.class, f.user, s.getId());
        int wordPos = 0;
        for (W w : words) {
            long wordId = jdbc.queryForObject("INSERT INTO sentence_attempt_words (attempt_id, position, expected_word, actual_word, "
                    + "outcome, accuracy_score) VALUES (?, ?, ?, ?, ?, ?) RETURNING id", Long.class, attempt, wordPos++,
                    w.text, w.text, w.accuracy < 60 ? "mispronounced" : "correct", w.accuracy);
            for (int i = 0; i < w.phonemes.length; i += 2) {
                jdbc.update("INSERT INTO sentence_attempt_phonemes (attempt_word_id, position, phoneme_id, accuracy_score) "
                        + "VALUES (?, ?, (SELECT id FROM phonemes WHERE symbol = ?), ?)", wordId, i / 2,
                        w.phonemes[i], ((Number) w.phonemes[i + 1]).doubleValue());
            }
        }
        return attempt;
    }

    private ResultActions offer(UUID user, long attemptId) throws Exception {
        return mockMvc.perform(post("/api/v1/tutor/offers").headers(auth(user)).contentType(MediaType.APPLICATION_JSON)
                .content("{\"attemptId\":" + attemptId + "}"));
    }

    private ResultActions createSession(UUID user, long attemptId, UUID offerId) throws Exception {
        String body = offerId == null ? "{\"attemptId\":" + attemptId + "}"
                : "{\"attemptId\":" + attemptId + ",\"offerId\":\"" + offerId + "\"}";
        return mockMvc.perform(post("/api/v1/tutor/sessions").headers(auth(user)).contentType(MediaType.APPLICATION_JSON).content(body));
    }

    /** Mã lời mời của lượt (gọi API để lời mời được tạo đúng như thực tế). */
    private String jdbcOfferId(UUID user, long attemptId) throws Exception {
        offer(user, attemptId).andExpect(status().isOk()).andExpect(jsonPath("$.data.offer").value(true));
        return jdbc.queryForObject("SELECT id::text FROM tutor_offers WHERE attempt_id = ?", String.class, attemptId);
    }

    private HttpHeaders auth(UUID user) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtTokenService.issueAccessToken(user, Role.STUDENT, UUID.randomUUID()).token());
        return headers;
    }

    private UUID newUser() {
        return userAccountService.createLocal("tu-" + UUID.randomUUID() + "@x.com", "Tu", "t").id();
    }

    private int usageOf(UUID user) {
        Integer n = jdbc.queryForObject(
                "SELECT coalesce(sum(used), 0) FROM usage_counters WHERE user_id = ? AND feature = 'tutor_session'",
                Integer.class, user);
        return n == null ? 0 : n;
    }

    private int count(String fromWhere, Object... args) {
        return jdbc.queryForObject("SELECT count(*) FROM " + fromWhere, Integer.class, args);
    }
}
