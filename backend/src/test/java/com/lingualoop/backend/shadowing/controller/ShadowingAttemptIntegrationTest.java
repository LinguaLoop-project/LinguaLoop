package com.lingualoop.backend.shadowing.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
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
import com.lingualoop.backend.support.WavFixtures;
import com.lingualoop.backend.user.service.ConsentService;
import com.lingualoop.backend.user.service.UserAccountService;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ShadowingAttemptIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private TopicRepository topics;
    @Autowired private LessonRepository lessons;
    @Autowired private SentenceRepository sentences;
    @Autowired private JdbcTemplate jdbc;

    @MockitoBean private PronunciationScoringService scoring;
    @MockitoBean private ConsentService consent;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    @BeforeEach
    void defaults() {
        when(consent.hasConsent(any(), any())).thenReturn(true);
        when(scoring.assess(any(), any())).thenReturn(helloWorld());
    }

    // ── UC-SHADOW-01 ────────────────────────────────────────────────────────────────

    @Test
    void assess_scoresAndStoresAttempt_AC_SHADOW_01() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("ok", false), 0, "Hello world");

        post(user, s.getId(), WavFixtures.valid(2_000))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.score").value(72.5))
                .andExpect(jsonPath("$.data.recognizedText").value("hello world"))
                .andExpect(jsonPath("$.data.words.length()").value(2))
                .andExpect(jsonPath("$.data.words[0].word").value("hello"))
                .andExpect(jsonPath("$.data.words[0].outcome").value("correct"))
                // phản hồi dùng ký hiệu bảng phonemes (cùng hệ với IPA mẫu của câu), không phải ký hiệu Azure
                .andExpect(jsonPath("$.data.words[0].phonemes[3].symbol").value("əʊ"))
                .andExpect(jsonPath("$.data.words[1].outcome").value("mispronounced"))
                .andExpect(jsonPath("$.data.usage.feature").value("shadowing_assess"))
                .andExpect(jsonPath("$.data.usage.used").value(1))
                .andExpect(jsonPath("$.data.usage.limit").value(5))
                .andExpect(jsonPath("$.data.usage.remaining").value(4));

        assertThat(count("sentence_attempts WHERE user_id = ? AND mode = 'shadowing' AND provider = 'azure'", user))
                .isEqualTo(1);
        assertThat(jdbc.queryForObject("""
                SELECT score FROM sentence_attempts WHERE user_id = ?""", Double.class, user)).isEqualTo(72.5);
        assertThat(jdbc.queryForList("""
                SELECT w.position FROM sentence_attempt_words w JOIN sentence_attempts a ON a.id = w.attempt_id
                WHERE a.user_id = ? ORDER BY w.position""", Integer.class, user)).containsExactly(0, 1);
        // oʊ của Azure được lưu thành əʊ trong bảng phonemes
        assertThat(jdbc.queryForObject("""
                SELECT count(*) FROM sentence_attempt_phonemes p
                JOIN phonemes ph ON ph.id = p.phoneme_id
                JOIN sentence_attempt_words w ON w.id = p.attempt_word_id
                JOIN sentence_attempts a ON a.id = w.attempt_id
                WHERE a.user_id = ? AND ph.symbol = 'əʊ'""", Integer.class, user)).isEqualTo(1);
        assertThat(count("sentence_attempt_phonemes p JOIN sentence_attempt_words w ON w.id = p.attempt_word_id "
                + "JOIN sentence_attempts a ON a.id = w.attempt_id WHERE a.user_id = ?", user)).isEqualTo(8);
    }

    @Test
    void assess_storesEachErrorTypeWithinConstraints_AC_SHADOW_02() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("types", false), 0, "Hello the world");
        when(scoring.assess(any(), any())).thenReturn(new PronunciationAssessment("hello world", 60, 60, 60, 60, null,
                List.of(
                        new WordResult("hello", 95, ErrorType.NONE, List.of(new PhonemeResult("h", 95))),
                        new WordResult("the", 0, ErrorType.OMISSION, List.of()),
                        new WordResult("uh", 0, ErrorType.INSERTION, List.of()),
                        new WordResult("world", 30, ErrorType.MISPRONUNCIATION, List.of(new PhonemeResult("w", 30))))));

        post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.prosody").doesNotExist());

        List<String> rows = jdbc.queryForList("""
                SELECT w.outcome || ':' || coalesce(w.expected_word, '-') || ':' || coalesce(w.actual_word, '-')
                FROM sentence_attempt_words w JOIN sentence_attempts a ON a.id = w.attempt_id
                WHERE a.user_id = ? ORDER BY w.position""", String.class, user);
        assertThat(rows).containsExactly("correct:hello:hello", "omitted:the:-", "inserted:-:uh",
                "mispronounced:world:world");
    }

    @Test
    void assess_freePlanBlocksSixthAttempt_AC_SHADOW_03() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("quota", false), 0, "Hello world");

        for (int i = 0; i < 5; i++) {
            post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        }
        post(user, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.code").value("QUOTA_EXCEEDED"))
                .andExpect(jsonPath("$.details.feature").value("shadowing_assess"))
                .andExpect(jsonPath("$.details.limit").value(5));

        verify(scoring, times(5)).assess(any(), any());
        assertThat(count("sentence_attempts WHERE user_id = ?", user)).isEqualTo(5);
    }

    @Test
    void assess_proPlanIsNotBlockedAtSixth_AC_SHADOW_04() throws Exception {
        UUID user = newUser();
        makePro(user);
        Sentence s = sentence(lesson("pro-ok", false), 0, "Hello world");

        for (int i = 0; i < 6; i++) {
            post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        }
        assertThat(count("sentence_attempts WHERE user_id = ?", user)).isEqualTo(6);
    }

    @Test
    void assess_azureFailure_refundsAttempt_AC_SHADOW_05() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("azure-down", false), 0, "Hello world");
        post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        when(scoring.assess(any(), any())).thenThrow(new BusinessException(ErrorCode.SHADOWING_SCORING_UNAVAILABLE));

        post(user, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.code").value("SHADOWING_SCORING_UNAVAILABLE"));

        assertThat(used(user)).isEqualTo(1);
        assertThat(count("sentence_attempts WHERE user_id = ?", user)).isEqualTo(1);
    }

    @Test
    void assess_unexpectedFailure_alsoRefunds_AC_SHADOW_05() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("boom", false), 0, "Hello world");
        when(scoring.assess(any(), any())).thenThrow(new IllegalStateException("boom"));

        post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isInternalServerError());

        assertThat(used(user)).isZero();
    }

    @Test
    void assess_noSpeech_refundsAttempt_AC_SHADOW_06() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("silent", false), 0, "Hello world");
        when(scoring.assess(any(), any())).thenThrow(new BusinessException(ErrorCode.SHADOWING_NO_SPEECH));

        post(user, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("SHADOWING_NO_SPEECH"));

        assertThat(used(user)).isZero();
        assertThat(count("sentence_attempts WHERE user_id = ?", user)).isZero();
    }

    @Test
    void assess_invalidAudio_isRejectedBeforeScoringAndQuota_AC_SHADOW_07() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("bad-audio", false), 0, "Hello world");

        post(user, s.getId(), "not a wav".getBytes())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SHADOWING_AUDIO_INVALID"))
                .andExpect(jsonPath("$.details.reason").value("not_wav"));
        post(user, s.getId(), WavFixtures.valid(100)).andExpect(status().isBadRequest());
        post(user, s.getId(), WavFixtures.valid(31_000)).andExpect(status().isBadRequest());

        verifyNoInteractions(scoring);
        assertThat(used(user)).isZero();
    }

    @Test
    void assess_withoutAiConsent_isForbiddenAndFree_AC_SHADOW_08() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("consent", false), 0, "Hello world");
        when(consent.hasConsent(any(), any())).thenReturn(false);

        post(user, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("AI_CONSENT_REQUIRED"));

        verifyNoInteractions(scoring);
        assertThat(used(user)).isZero();
    }

    @Test
    void assess_unknownSentenceAndProLesson_AC_SHADOW_09() throws Exception {
        UUID user = newUser();
        Sentence paid = sentence(lesson("paid", true), 0, "Hello world");

        post(user, UUID.randomUUID(), WavFixtures.valid(1_000))
                .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NOT_FOUND"));
        post(user, paid.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isForbidden()).andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));

        verify(scoring, never()).assess(any(), any());
        assertThat(used(user)).isZero();
    }

    @Test
    void endpoints_requireAuthentication_AC_SHADOW_10() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(multipart("/api/v1/sentences/{id}/shadowing-attempts", id)
                        .file(new MockMultipartFile("audio", "a.wav", "audio/wav", WavFixtures.valid(1_000))))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/lessons/x/shadowing-attempts/latest")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/me/usage")).andExpect(status().isUnauthorized());
    }

    @Test
    void assess_concurrentRequestsForLastAttempt_onlyOneSucceeds_AC_SHADOW_11() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("race", false), 0, "Hello world");
        for (int i = 0; i < 4; i++) {
            post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        }

        int threads = 4;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Integer>> results = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            Callable<Integer> call = () -> {
                start.await();
                return post(user, s.getId(), WavFixtures.valid(1_000)).andReturn().getResponse().getStatus();
            };
            results.add(pool.submit(call));
        }
        start.countDown();
        List<Integer> statuses = new ArrayList<>();
        for (Future<Integer> f : results) {
            statuses.add(f.get());
        }
        pool.shutdown();

        assertThat(statuses).containsOnlyOnce(200).filteredOn(c -> c != 200).containsOnly(429);
        assertThat(used(user)).isEqualTo(5);
        assertThat(count("sentence_attempts WHERE user_id = ?", user)).isEqualTo(5);
    }

    // ── UC-SHADOW-02 ────────────────────────────────────────────────────────────────

    @Test
    void assess_unknownPhoneme_isReturnedButNotStored_AC_SHADOW_14() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("unknown-ph", false), 0, "Hello");
        when(scoring.assess(any(), any())).thenReturn(new PronunciationAssessment("hello", 80, 80, 80, 80, null,
                List.of(new WordResult("hello", 80, ErrorType.NONE,
                        List.of(new PhonemeResult("h", 90), new PhonemeResult("zzz", 50), new PhonemeResult("l", 70))))));

        post(user, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.words[0].phonemes.length()").value(3))
                .andExpect(jsonPath("$.data.words[0].phonemes[1].symbol").value("zzz"));

        assertThat(jdbc.queryForList("""
                SELECT p.position FROM sentence_attempt_phonemes p
                JOIN sentence_attempt_words w ON w.id = p.attempt_word_id
                JOIN sentence_attempts a ON a.id = w.attempt_id WHERE a.user_id = ? ORDER BY p.position""",
                Integer.class, user)).containsExactly(0, 2);
    }

    // ── UC-SHADOW-03 ────────────────────────────────────────────────────────────────

    @Test
    void latest_returnsLatestPerSentenceOnlyForCaller_AC_SHADOW_15() throws Exception {
        UUID me = newUser();
        UUID other = newUser();
        Lesson lesson = lesson("latest", false);
        Sentence first = sentence(lesson, 0, "First one");
        Sentence second = sentence(lesson, 1, "Second one");
        sentence(lesson, 2, "Never read");

        when(scoring.assess(any(), any())).thenReturn(assessmentWithScore(90));
        post(me, first.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        when(scoring.assess(any(), any())).thenReturn(assessmentWithScore(55));
        post(me, first.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        post(me, second.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        post(other, second.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode, submitted_text, score) "
                + "VALUES (?, ?, 'dictation', 'x', 100)", me, first.getId());

        mockMvc.perform(get("/api/v1/lessons/{slug}/shadowing-attempts/latest", lesson.getSlug()).headers(auth(me)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].sentenceId").value(first.getId().toString()))
                .andExpect(jsonPath("$.data[0].score").value(55.0))
                .andExpect(jsonPath("$.data[0].bestScore").value(90.0))
                .andExpect(jsonPath("$.data[0].attemptCount").value(2))
                .andExpect(jsonPath("$.data[0].words[0].word").value("hello"))
                .andExpect(jsonPath("$.data[0].words[0].outcome").value("correct"))
                .andExpect(jsonPath("$.data[1].sentenceId").value(second.getId().toString()))
                .andExpect(jsonPath("$.data[1].attemptCount").value(1));
    }

    @Test
    void latest_unknownOrProLesson_AC_SHADOW_16() throws Exception {
        UUID user = newUser();
        Lesson paid = lesson("latest-paid", true);

        mockMvc.perform(get("/api/v1/lessons/{slug}/shadowing-attempts/latest", "no-such-lesson").headers(auth(user)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/lessons/{slug}/shadowing-attempts/latest", paid.getSlug()).headers(auth(user)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));
    }

    // ── UC-SHADOW-05 ────────────────────────────────────────────────────────────────

    @Test
    void progress_isRecordedAndModeCompletesWhenAllSentencesRead_AC_SHADOW_19_20() throws Exception {
        UUID user = newUser();
        Lesson lesson = lesson("progress", false);
        Sentence a = sentence(lesson, 0, "One");
        Sentence b = sentence(lesson, 1, "Two");

        post(user, a.getId(), WavFixtures.valid(2_500)).andExpect(status().isOk());

        assertThat(count("user_lesson_progress WHERE user_id = ? AND lesson_id = '" + lesson.getId() + "'", user))
                .isEqualTo(1);
        assertThat(jdbc.queryForObject("""
                SELECT total_time_sec FROM user_lesson_mode_progress
                WHERE user_id = ? AND lesson_id = ? AND mode = 'shadowing'""", Integer.class, user, lesson.getId()))
                .isEqualTo(3);
        assertThat(modeCompletedAt(user, lesson)).isNull();

        post(user, b.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        Object completedAt = modeCompletedAt(user, lesson);
        assertThat(completedAt).isNotNull();

        post(user, a.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        assertThat(modeCompletedAt(user, lesson)).isEqualTo(completedAt);
    }

    // ── helpers ─────────────────────────────────────────────────────────────────────

    private ResultActions post(UUID user, UUID sentenceId, byte[] audio) throws Exception {
        return mockMvc.perform(multipart("/api/v1/sentences/{id}/shadowing-attempts", sentenceId)
                .file(new MockMultipartFile("audio", "a.wav", "audio/wav", audio))
                .headers(auth(user)));
    }

    private HttpHeaders auth(UUID user) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtTokenService.issueAccessToken(user, Role.STUDENT, UUID.randomUUID()).token());
        return headers;
    }

    private UUID newUser() {
        return userAccountService.createLocal("sh-" + UUID.randomUUID() + "@x.com", "Sh", "h").id();
    }

    private void makePro(UUID user) {
        jdbc.update("INSERT INTO user_subscriptions (user_id, status, expires_at) "
                + "VALUES (?, 'active', now() + interval '10 days')", user);
    }

    private int used(UUID user) {
        Integer n = jdbc.queryForObject(
                "SELECT coalesce(sum(used), 0) FROM usage_counters WHERE user_id = ? AND feature = 'shadowing_assess'",
                Integer.class, user);
        return n == null ? 0 : n;
    }

    private int count(String fromWhere, Object... args) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM " + fromWhere, Integer.class, args);
        return n == null ? 0 : n;
    }

    private Object modeCompletedAt(UUID user, Lesson lesson) {
        return jdbc.queryForObject("""
                SELECT completed_at FROM user_lesson_mode_progress
                WHERE user_id = ? AND lesson_id = ? AND mode = 'shadowing'""", Object.class, user, lesson.getId());
    }

    private static PronunciationAssessment helloWorld() {
        return new PronunciationAssessment("hello world", 72.5, 70, 80, 100, 65.0, List.of(
                new WordResult("hello", 91, ErrorType.NONE, List.of(
                        new PhonemeResult("h", 99), new PhonemeResult("ə", 95),
                        new PhonemeResult("l", 90), new PhonemeResult("oʊ", 80))),
                new WordResult("world", 45, ErrorType.MISPRONUNCIATION, List.of(
                        new PhonemeResult("w", 90), new PhonemeResult("ɝ", 30),
                        new PhonemeResult("l", 60), new PhonemeResult("d", 70)))));
    }

    private static PronunciationAssessment assessmentWithScore(double score) {
        return new PronunciationAssessment("hello", score, score, score, 100, null,
                List.of(new WordResult("hello", score, ErrorType.NONE, List.of(new PhonemeResult("h", score)))));
    }

    private Lesson lesson(String name, boolean pro) {
        Topic topic = new Topic();
        topic.setSlug(name + "-t-" + tag);
        topic.setName(name + " topic");
        topic = topics.save(topic);

        Lesson l = new Lesson();
        l.setTopic(topic);
        l.setSlug(name + "-" + tag);
        l.setTitle(name + " " + tag);
        l.setDifficulty(CefrLevel.B1);
        l.setPro(pro);
        l.setStatus(LessonStatus.APPROVED);
        return lessons.save(l);
    }

    private Sentence sentence(Lesson lesson, int order, String text) {
        Sentence s = new Sentence();
        s.setLesson(lesson);
        s.setSortOrder(order);
        s.setText(text);
        s.setStartMs(order * 1000);
        s.setEndMs(order * 1000 + 900);
        s.setCefrLevel(CefrLevel.A1);
        return sentences.save(s);
    }
}
