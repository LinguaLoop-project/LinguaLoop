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

import com.lingualoop.backend.shadowing.service.PhonemeTips;
import com.lingualoop.backend.support.TestData;
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
import com.lingualoop.backend.shadowing.azure.AzurePhonemeMapper;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment.ErrorType;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment.PhonemeResult;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment.WordResult;
import com.lingualoop.backend.shadowing.azure.PronunciationScoringService;
import com.lingualoop.backend.support.WavFixtures;
import com.lingualoop.backend.user.service.UserAccountService;

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ShadowingAttemptIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private PhonemeTips phonemeTips;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private TopicRepository topics;
    @Autowired private LessonRepository lessons;
    @Autowired private SentenceRepository sentences;
    @Autowired private JdbcTemplate jdbc;

    @MockitoBean private PronunciationScoringService scoring;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    @BeforeEach
    void defaults() {
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
                // phản hồi dùng ký hiệu bảng phonemes (giọng Mỹ, cùng hệ với IPA mẫu của câu và với Azure)
                .andExpect(jsonPath("$.data.words[0].phonemes[3].symbol").value("oʊ"))
                .andExpect(jsonPath("$.data.words[1].outcome").value("mispronounced"))
                // chấm shadowing bằng Azure không tốn credit AI nên phản hồi không có số dư
                .andExpect(jsonPath("$.data.usage").doesNotExist());

        assertThat(count("sentence_attempts WHERE user_id = ? AND mode = 'shadowing'", user))
                .isEqualTo(1);
        assertThat(jdbc.queryForObject("""
                SELECT total_score FROM sentence_attempts WHERE user_id = ?""", Double.class, user)).isEqualTo(72.5);
        assertThat(jdbc.queryForList("""
                SELECT w.position FROM sentence_attempt_words w JOIN sentence_attempts a ON a.id = w.attempt_id
                WHERE a.user_id = ? ORDER BY w.position""", Integer.class, user)).containsExactly(0, 1);
        // oʊ của Azure được lưu đúng ký hiệu đó trong bảng phonemes (không còn đổi sang ký hiệu Anh)
        assertThat(jdbc.queryForObject("""
                SELECT count(*) FROM sentence_attempt_phonemes p
                JOIN phonemes ph ON ph.id = p.heard_phoneme_id
                JOIN sentence_attempt_words w ON w.id = p.attempt_word_id
                JOIN sentence_attempts a ON a.id = w.attempt_id
                WHERE a.user_id = ? AND ph.symbol = 'oʊ'""", Integer.class, user)).isEqualTo(1);
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
    void assess_freePlanIsNotLimited_AC_SHADOW_03() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("quota", false), 0, "Hello world");

        for (int i = 0; i < 12; i++) {
            post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        }

        verify(scoring, times(12)).assess(any(), any());
        assertThat(count("sentence_attempts WHERE user_id = ?", user)).isEqualTo(12);
        assertThat(energyUsed(user)).isZero();
    }

    @Test
    void assess_proPlanIsNotLimited_AC_SHADOW_04() throws Exception {
        UUID user = newUser();
        makePro(user);
        Sentence s = sentence(lesson("pro-ok", false), 0, "Hello world");

        for (int i = 0; i < 6; i++) {
            post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        }
        assertThat(count("sentence_attempts WHERE user_id = ?", user)).isEqualTo(6);
    }

    @Test
    void assess_azureFailure_savesNothing_AC_SHADOW_05() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("azure-down", false), 0, "Hello world");
        post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        when(scoring.assess(any(), any())).thenThrow(new BusinessException(ErrorCode.SHADOWING_SCORING_UNAVAILABLE));

        post(user, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.code").value("SHADOWING_SCORING_UNAVAILABLE"));

        assertThat(energyUsed(user)).isZero();
        assertThat(count("sentence_attempts WHERE user_id = ?", user)).isEqualTo(1);
    }

    @Test
    void assess_azureBusy_returns503SavesNothingAndKeepsLaterCallsWorking_AC_SHADOW_38() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("azure-busy", false), 0, "Hello world");
        when(scoring.assess(any(), any())).thenThrow(new BusinessException(ErrorCode.SHADOWING_SCORING_BUSY));

        post(user, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.code").value("SHADOWING_SCORING_BUSY"));

        assertThat(energyUsed(user)).isZero();
        assertThat(count("sentence_attempts WHERE user_id = ?", user)).isZero();

        // hết bận thì chấm bình thường, không cần chờ gì thêm (doReturn: when() sẽ gọi lại mock đang ném lỗi)
        org.mockito.Mockito.doReturn(helloWorld()).when(scoring).assess(any(), any());
        post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        assertThat(count("sentence_attempts WHERE user_id = ?", user)).isEqualTo(1);
    }

    @Test
    void assess_unexpectedFailure_savesNothing_AC_SHADOW_05() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("boom", false), 0, "Hello world");
        when(scoring.assess(any(), any())).thenThrow(new IllegalStateException("boom"));

        post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isInternalServerError());

        assertThat(energyUsed(user)).isZero();
    }

    @Test
    void assess_noSpeech_savesNothing_AC_SHADOW_06() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("silent", false), 0, "Hello world");
        when(scoring.assess(any(), any())).thenThrow(new BusinessException(ErrorCode.SHADOWING_NO_SPEECH));

        post(user, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("SHADOWING_NO_SPEECH"));

        assertThat(energyUsed(user)).isZero();
        assertThat(count("sentence_attempts WHERE user_id = ?", user)).isZero();
    }

    @Test
    void assess_invalidAudio_isRejectedBeforeScoring_AC_SHADOW_07() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("bad-audio", false), 0, "Hello world");

        post(user, s.getId(), "not a wav".getBytes())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("SHADOWING_AUDIO_INVALID"))
                .andExpect(jsonPath("$.details.reason").value("not_wav"));
        post(user, s.getId(), WavFixtures.valid(100)).andExpect(status().isBadRequest());
        post(user, s.getId(), WavFixtures.valid(31_000)).andExpect(status().isBadRequest());

        verifyNoInteractions(scoring);
        assertThat(energyUsed(user)).isZero();
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
        assertThat(energyUsed(user)).isZero();
    }

    @Test
    void endpoints_requireAuthentication_AC_SHADOW_10() throws Exception {
        UUID id = UUID.randomUUID();
        mockMvc.perform(multipart("/api/v1/sentences/{id}/shadowing-attempts", id)
                        .file(new MockMultipartFile("audio", "a.wav", "audio/wav", WavFixtures.valid(1_000))))
                .andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/lessons/x/shadowing-attempts/latest")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/credits/balance")).andExpect(status().isUnauthorized());
    }

    @Test
    void assess_concurrentRequests_areAllScored_AC_SHADOW_11() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("race", false), 0, "Hello world");

        int threads = 8;
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

        assertThat(statuses).hasSize(threads).containsOnly(200);
        assertThat(energyUsed(user)).isZero();
        assertThat(count("sentence_attempts WHERE user_id = ?", user)).isEqualTo(threads);
    }

    // ── UC-SHADOW-02 ────────────────────────────────────────────────────────────────

    @Test
    void assess_unknownPhoneme_isReturnedAndStoredWithItsRawSymbol_AC_SHADOW_14() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("unknown-ph", false), 0, "Hello");
        when(scoring.assess(any(), any())).thenReturn(new PronunciationAssessment("hello", 80, 80, 80, 80, null,
                List.of(new WordResult("hello", 80, ErrorType.NONE,
                        List.of(new PhonemeResult("h", 90), new PhonemeResult("zzz", 50), new PhonemeResult("l", 70))))));

        post(user, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.words[0].phonemes.length()").value(3))
                .andExpect(jsonPath("$.data.words[0].phonemes[1].symbol").value("zzz"));

        // Âm lạ vẫn được lưu: heard rỗng, giữ ký hiệu gốc để hiển thị và xử lý lại khi bổ sung bộ chuyển đổi
        assertThat(jdbc.queryForList("""
                SELECT p.position || ':' || COALESCE(p.azure_symbol, '-') || ':' || (p.heard_phoneme_id IS NULL)
                FROM sentence_attempt_phonemes p
                JOIN sentence_attempt_words w ON w.id = p.attempt_word_id
                JOIN sentence_attempts a ON a.id = w.attempt_id WHERE a.user_id = ? ORDER BY p.position""",
                String.class, user)).containsExactly("0:h:false", "1:zzz:true", "2:l:false");
    }

    @Test
    void assess_storesTheDurationOfTheRecording() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("duration-ms", false), 0, "Hello");
        when(scoring.assess(any(), any())).thenReturn(new PronunciationAssessment("hello", 80, 80, 80, 80, null,
                List.of(new WordResult("hello", 80, ErrorType.NONE, List.of(new PhonemeResult("h", 90))))));

        post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());

        assertThat(jdbc.queryForObject("SELECT duration_ms FROM sentence_attempts WHERE user_id = ?", Integer.class, user))
                .isEqualTo(1_000);
    }

    // ── UC-SHADOW-07 / UC-SHADOW-08 ──────────────────────────────────────────────────

    private void givenWeakAndStrongPhonemes() {
        when(scoring.assess(any(), any())).thenReturn(new PronunciationAssessment("think", 70, 70, 70, 70, null,
                List.of(new WordResult("think", 70, ErrorType.MISPRONUNCIATION, List.of(
                        new PhonemeResult("θ", 40), new PhonemeResult("ɪ", 90), new PhonemeResult("zzz", 30))))));
    }

    @Test
    void assess_weakPhoneme_getsTipAndLockedMouthVideoForFree_AC_SHADOW_21() throws Exception {
        UUID free = newUser();
        Sentence s = sentence(lesson("tips-free", false), 0, "Think");
        givenWeakAndStrongPhonemes();

        post(free, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isOk())
                // θ: có mẹo; video bị khoá nên không có đường dẫn
                .andExpect(jsonPath("$.data.words[0].phonemes[0].tip").isNotEmpty())
                .andExpect(jsonPath("$.data.words[0].phonemes[0].mouthVideo.locked").value(true))
                .andExpect(jsonPath("$.data.words[0].phonemes[0].mouthVideo.url").value((Object) null))
                // ɪ đạt điểm vẫn có mẹo để người học bấm vào xem
                .andExpect(jsonPath("$.data.words[0].phonemes[1].tip").isNotEmpty())
                // âm không có trong bảng: không có mẹo, không có video
                .andExpect(jsonPath("$.data.words[0].phonemes[2].tip").value((Object) null))
                .andExpect(jsonPath("$.data.words[0].phonemes[2].mouthVideo").value((Object) null));
    }

    @Test
    void assess_weakPhoneme_getsMouthVideoLinkForPro_AC_SHADOW_22() throws Exception {
        UUID pro = newUser();
        makePro(pro);
        Sentence s = sentence(lesson("tips-pro", false), 0, "Think");
        givenWeakAndStrongPhonemes();

        post(pro, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.words[0].phonemes[0].tip").isNotEmpty())
                .andExpect(jsonPath("$.data.words[0].phonemes[0].mouthVideo.locked").value(false))
                .andExpect(jsonPath("$.data.words[0].phonemes[0].mouthVideo.url").isNotEmpty());
    }

    @Test
    void assess_heardSoundDiffersFromModel_hintFollowsTheModelSound_AC_SHADOW_34() throws Exception {
        UUID pro = newUser();
        makePro(pro);
        Sentence s = sentence(lesson("expected-live", false), 0, "if");
        s.setIpaUs("/ɪf/");
        sentences.save(s);
        // Người học đọc thành "iv": Azure trả ɪ và v
        when(scoring.assess(any(), any())).thenReturn(new PronunciationAssessment("if", 70, 70, 70, 70, null,
                List.of(new WordResult("if", 40, ErrorType.MISPRONUNCIATION,
                        List.of(new PhonemeResult("ɪ", 50), new PhonemeResult("v", 38))))));

        post(pro, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.words[0].phonemes[1].symbol").value("v"))
                .andExpect(jsonPath("$.data.words[0].phonemes[1].expected").value("f"))
                // video của âm cần sửa (f), không phải âm nghe được (v)
                .andExpect(jsonPath("$.data.words[0].phonemes[1].mouthVideo.url")
                        .value("https://youtu.be/vE12RFyH-hY"));
    }

    @Test
    void assess_consonantDiffersFromModelButScoresHigh_isStillFlaggedNeedsFix_AC_SHADOW_35() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("needs-fix", false), 0, "if");
        s.setIpaUs("/ɪf/");
        sentences.save(s);
        // Azure chấm 100 cho cách đọc "iv" (đo từ Azure thật), nhưng /f/ vẫn cần sửa
        when(scoring.assess(any(), any())).thenReturn(new PronunciationAssessment("if", 100, 100, 100, 100, null,
                List.of(new WordResult("if", 100, ErrorType.NONE,
                        List.of(new PhonemeResult("ɪ", 100), new PhonemeResult("v", 100))))));

        post(user, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.words[0].phonemes[0].needsFix").value(false))
                .andExpect(jsonPath("$.data.words[0].phonemes[1].needsFix").value(true))
                .andExpect(jsonPath("$.data.words[0].phonemes[1].expected").value("f"));
    }

    @Test
    void latest_heardSoundDiffersFromModel_hintFollowsTheModelSound_AC_SHADOW_34() throws Exception {
        UUID pro = newUser();
        makePro(pro);
        Lesson lesson = lesson("expected-restore", false);
        Sentence s = sentence(lesson, 0, "if");
        s.setIpaUs("/ɪf/");
        sentences.save(s);
        when(scoring.assess(any(), any())).thenReturn(new PronunciationAssessment("if", 70, 70, 70, 70, null,
                List.of(new WordResult("if", 40, ErrorType.MISPRONUNCIATION,
                        List.of(new PhonemeResult("ɪ", 50), new PhonemeResult("v", 38))))));
        post(pro, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());

        mockMvc.perform(get("/api/v1/lessons/{id}/shadowing-attempts/latest", lesson.getId()).headers(auth(pro)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].words[0].phonemes[0].expected").value("ɪ"))
                .andExpect(jsonPath("$.data[0].words[0].phonemes[1].symbol").value("v"))
                .andExpect(jsonPath("$.data[0].words[0].phonemes[1].expected").value("f"))
                .andExpect(jsonPath("$.data[0].words[0].phonemes[1].mouthVideo.url")
                        .value("https://youtu.be/vE12RFyH-hY"));
    }

    @Test
    void assess_storesAzureSymbolTargetAndTopAlternative_AC_SHADOW_36() throws Exception {
        UUID user = newUser();
        Sentence s = sentence(lesson("target-model", false), 0, "if");
        s.setIpaUs("/ɪf/");
        sentences.save(s);
        // Đo từ Azure thật: đọc "iv" thì Azure báo v và chấm 100; f chỉ là ứng viên 43
        when(scoring.assess(any(), any())).thenReturn(new PronunciationAssessment("if", 100, 100, 100, 100, null,
                List.of(new WordResult("if", 100, ErrorType.NONE, List.of(
                        new PhonemeResult("ɪ", 100),
                        new PhonemeResult("v", 100, List.of(new PronunciationAssessment.Candidate("v", 100),
                                new PronunciationAssessment.Candidate("f", 43))))))));

        post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());

        assertThat(jdbc.queryForMap("""
                SELECT rep.symbol AS reported, tgt.symbol AS target, alt.symbol AS alternative
                FROM sentence_attempt_phonemes p
                JOIN sentence_attempt_words w ON w.id = p.attempt_word_id
                JOIN sentence_attempts a ON a.id = w.attempt_id
                JOIN phonemes rep ON rep.id = p.heard_phoneme_id
                JOIN phonemes tgt ON tgt.id = p.target_phoneme_id
                JOIN phonemes alt ON alt.id = p.alt_phoneme_id
                WHERE a.user_id = ? AND p.position = 1""", user))
                .containsEntry("reported", "v")
                .containsEntry("target", "f").containsEntry("alternative", "f");

        // Thống kê theo âm đích: /f/ có 1 cơ hội và 1 lỗi (phụ âm khác âm đích dù điểm 100)
        assertThat(jdbc.queryForMap("""
                SELECT s.total, s.errors FROM v_user_phoneme_stats s
                JOIN phonemes p ON p.id = s.phoneme_id WHERE s.user_id = ? AND p.symbol = 'f'""", user))
                .containsEntry("total", 1L).containsEntry("errors", 1L);
    }

    @Test
    void latest_usesTheTargetStoredAtScoringTime_evenIfTheSentenceIpaChangesLater_AC_SHADOW_36() throws Exception {
        UUID user = newUser();
        Lesson lesson = lesson("target-stored", false);
        Sentence s = sentence(lesson, 0, "if");
        s.setIpaUs("/ɪf/");
        sentences.save(s);
        when(scoring.assess(any(), any())).thenReturn(new PronunciationAssessment("if", 100, 100, 100, 100, null,
                List.of(new WordResult("if", 100, ErrorType.NONE,
                        List.of(new PhonemeResult("ɪ", 100), new PhonemeResult("v", 100))))));
        post(user, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        s.setIpaUs(null);
        sentences.save(s);

        mockMvc.perform(get("/api/v1/lessons/{id}/shadowing-attempts/latest", lesson.getId()).headers(auth(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].words[0].phonemes[1].symbol").value("v"))
                .andExpect(jsonPath("$.data[0].words[0].phonemes[1].expected").value("f"))
                .andExpect(jsonPath("$.data[0].words[0].phonemes[1].needsFix").value(true));
    }

    @Test
    void assess_noModelIpa_expectedIsEmptyAndHintFollowsHeardSound_AC_SHADOW_34() throws Exception {
        UUID pro = newUser();
        makePro(pro);
        Sentence s = sentence(lesson("expected-none", false), 0, "Think");
        givenWeakAndStrongPhonemes();

        post(pro, s.getId(), WavFixtures.valid(1_000))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.words[0].phonemes[0].expected").value((Object) null))
                .andExpect(jsonPath("$.data.words[0].phonemes[0].tip").isNotEmpty());
    }

    @Test
    void tipFile_coversAll44Phonemes_AC_SHADOW_21() {
        List<String> symbols = jdbc.queryForList("SELECT symbol FROM phonemes", String.class);
        assertThat(phonemeTips.all().keySet()).contains("θ", "ð", "ʃ", "ʒ", "z", "v", "ɹ", "s", "t", "d", "l", "ɪ", "i", "æ", "ɚ");
        // Mọi âm của bảng phonemes đều có mẹo, và không mẹo nào nói riêng về giọng Anh
        assertThat(phonemeTips.all().keySet()).containsAll(symbols);
        assertThat(phonemeTips.all().values()).noneMatch(tip -> tip.toLowerCase().contains("anh-anh"));
    }

    @Test
    void phonemeTable_isTheAmericanInventory_sameSymbolsAsAzureEnUs_ADR_0007() {
        List<String> symbols = jdbc.queryForList("SELECT symbol FROM phonemes", String.class);
        assertThat(symbols).hasSize(44).doesNotHaveDuplicates()
                .contains("ɝ", "ɚ", "oʊ", "ɛ", "ɑ", "ɔ", "i", "u", "ɹ", "ɪɹ", "ɛɹ", "ʊɹ")
                // ký hiệu giọng Anh không còn, và ɒ đã gộp vào ɑ
                .doesNotContain("ɜː", "əʊ", "ɪə", "eə", "ʊə", "iː", "uː", "ɑː", "ɔː", "ɒ", "e", "r");
        // Mọi ký hiệu mà bộ chuyển đổi trả ra đều có hàng tương ứng trong bảng
        assertThat(symbols).containsExactlyInAnyOrderElementsOf(AzurePhonemeMapper.tableSymbols());
    }

    @Test
    void everyPhonemeHasAMouthVideo_andTheNineBritishOnesWereReplacedByAmericanVideos_ADR_0007() {
        assertThat(jdbc.queryForList("SELECT symbol FROM phonemes WHERE mouth_video_url IS NULL", String.class)).isEmpty();
        // Video BBC Learning English cũ (giọng Anh) của các âm có khẩu hình khác giọng Mỹ không còn được dùng
        for (String britishVideo : List.of("zSJJWHymEPw", "r1BRCG0P9C8", "vC0h4S0YPJc", "0J7-5maJJIk", "nHSqluHrD-U",
                "uDHMuMQdBNw", "KHllC40_u1Q", "wg0P0oYkniE")) {
            assertThat(jdbc.queryForList("SELECT symbol FROM phonemes WHERE mouth_video_url LIKE ?", String.class,
                    "%" + britishVideo + "%")).as(britishVideo).isEmpty();
        }
        assertThat(jdbc.queryForObject("SELECT mouth_video_url FROM phonemes WHERE symbol = 'ɚ'", String.class))
                .isEqualTo("https://youtu.be/AzNRoSGBh44");
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
        jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode, level, submitted_text, "
                + "total_score) VALUES (?, ?, 'dictation', 'normal', 'x', 100)", me, first.getId());

        mockMvc.perform(get("/api/v1/lessons/{id}/shadowing-attempts/latest", lesson.getId()).headers(auth(me)))
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
    void latest_restoresEverythingTheAttemptResponseHad_AC_SHADOW_33() throws Exception {
        UUID free = newUser();
        UUID pro = newUser();
        makePro(pro);
        Lesson lesson = lesson("restore", false);
        Sentence s = sentence(lesson, 0, "Think");
        givenWeakAndStrongPhonemes();
        post(free, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        post(pro, s.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        long proAttempt = jdbc.queryForObject("SELECT id FROM sentence_attempts WHERE user_id = ?", Long.class, pro);
        jdbc.update("INSERT INTO ai_feedback (attempt_id, content) VALUES (?, ?)",
                proAttempt, "Bạn đọc khá tốt.");

        mockMvc.perform(get("/api/v1/lessons/{id}/shadowing-attempts/latest", lesson.getId()).headers(auth(free)))
                .andExpect(status().isOk())
                // điểm thành phần
                .andExpect(jsonPath("$.data[0].accuracy").value(70.0))
                .andExpect(jsonPath("$.data[0].fluency").value(70.0))
                .andExpect(jsonPath("$.data[0].completeness").value(70.0))
                // âm vị theo bảng phonemes, mẹo sửa cho âm yếu, video bị khoá với gói Free
                // âm lạ cũng được khôi phục (đã lưu với ký hiệu gốc)
                .andExpect(jsonPath("$.data[0].words[0].phonemes.length()").value(3))
                .andExpect(jsonPath("$.data[0].words[0].phonemes[2].symbol").value("zzz"))
                .andExpect(jsonPath("$.data[0].words[0].phonemes[0].symbol").value("θ"))
                .andExpect(jsonPath("$.data[0].words[0].phonemes[0].tip").isNotEmpty())
                .andExpect(jsonPath("$.data[0].words[0].phonemes[0].mouthVideo.locked").value(true))
                .andExpect(jsonPath("$.data[0].words[0].phonemes[0].mouthVideo.url").value((Object) null))
                .andExpect(jsonPath("$.data[0].words[0].phonemes[1].symbol").value("ɪ"))
                .andExpect(jsonPath("$.data[0].words[0].phonemes[1].tip").isNotEmpty())
                .andExpect(jsonPath("$.data[0].aiFeedback").value((Object) null));

        mockMvc.perform(get("/api/v1/lessons/{id}/shadowing-attempts/latest", lesson.getId()).headers(auth(pro)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].words[0].phonemes[0].mouthVideo.locked").value(false))
                .andExpect(jsonPath("$.data[0].words[0].phonemes[0].mouthVideo.url").isNotEmpty())
                // nhận xét AI đã lưu được trả kèm
                .andExpect(jsonPath("$.data[0].aiFeedback.content").value("Bạn đọc khá tốt."));
    }

    @Test
    void latest_unknownOrProLesson_AC_SHADOW_16() throws Exception {
        UUID user = newUser();
        Lesson paid = lesson("latest-paid", true);

        mockMvc.perform(get("/api/v1/lessons/{id}/shadowing-attempts/latest", UUID.randomUUID()).headers(auth(user)))
                .andExpect(status().isNotFound());
        mockMvc.perform(get("/api/v1/lessons/{id}/shadowing-attempts/latest", paid.getId()).headers(auth(user)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));
    }

    // ── UC-SHADOW-05 ────────────────────────────────────────────────────────────────

    @Test
    void progress_isDerivedFromAttempts_AC_SHADOW_19_20() throws Exception {
        UUID user = newUser();
        Lesson lesson = lesson("progress", false);
        Sentence a = sentence(lesson, 0, "One");
        Sentence b = sentence(lesson, 1, "Two");

        post(user, a.getId(), WavFixtures.valid(2_500)).andExpect(status().isOk());
        shadowingPercent(user, lesson, 50);

        post(user, b.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        shadowingPercent(user, lesson, 100);

        post(user, a.getId(), WavFixtures.valid(1_000)).andExpect(status().isOk());
        shadowingPercent(user, lesson, 100);
    }

    private void shadowingPercent(UUID user, Lesson lesson, int expected) throws Exception {
        mockMvc.perform(get("/api/v1/lessons/{id}", lesson.getId()).headers(auth(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.progress.shadowingPercent").value(expected));
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
        TestData.grantPro(jdbc, user, 1);
    }

    /** Tổng credit đã trừ của người dùng: chấm shadowing bằng Azure không được trừ credit nào. */
    private int energyUsed(UUID user) {
        Integer n = jdbc.queryForObject("SELECT coalesce(sum(credits_charged), 0) FROM ai_usage_logs WHERE user_id = ?",
                Integer.class, user);
        return n == null ? 0 : n;
    }

    private int count(String fromWhere, Object... args) {
        Integer n = jdbc.queryForObject("SELECT count(*) FROM " + fromWhere, Integer.class, args);
        return n == null ? 0 : n;
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
        topic.setName(name + " topic");
        topic = topics.save(topic);

        Lesson l = new Lesson();
        l.setTopic(topic);
        l.setTitle(name + " " + tag);
        l.setOwnerId(com.lingualoop.backend.lesson.LessonFixtures.SYSTEM_TEACHER);
        l.setYoutubeId(java.util.UUID.randomUUID().toString().replace("-", "").substring(0, 11));
        l.setDurationSec(600);
        l.setCefrLevel(CefrLevel.B1);
        l.setPro(pro);
        l.setStatus(LessonStatus.PUBLISHED);
        return lessons.save(l);
    }

    private Sentence sentence(Lesson lesson, int order, String text) {
        Sentence s = new Sentence();
        s.setLesson(lesson);
        s.setTextEn(text);
        s.setStartMs(order * 1000);
        s.setEndMs(order * 1000 + 900);
        return sentences.save(s);
    }
}
