package com.lingualoop.backend.shadowing.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;

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
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment.ErrorType;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment.PhonemeResult;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment.WordResult;
import com.lingualoop.backend.shadowing.azure.PronunciationScoringService;
import com.lingualoop.backend.shadowing.repository.PhonemeConfusionRepository;
import com.lingualoop.backend.support.WavFixtures;
import com.lingualoop.backend.user.service.ConsentService;
import com.lingualoop.backend.user.service.UserAccountService;

/** Mẹo sửa chỉ là phần thêm: bảng mẹo lỗi thì kết quả chấm vẫn được trả và lượt vẫn được lưu (AC-SHADOW-23). */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ShadowingHintsFailureIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private TopicRepository topics;
    @Autowired private LessonRepository lessons;
    @Autowired private SentenceRepository sentences;
    @Autowired private JdbcTemplate jdbc;

    @MockitoBean private PronunciationScoringService scoring;
    @MockitoBean private ConsentService consent;
    @MockitoBean private PhonemeConfusionRepository confusions;

    @Test
    void assess_whenTipLookupFails_stillReturnsTheScoreAndKeepsTheAttempt_AC_SHADOW_23() throws Exception {
        when(consent.hasConsent(any(), any())).thenReturn(true);
        when(scoring.assess(any(), any())).thenReturn(new PronunciationAssessment("think", 70, 70, 70, 70, null,
                List.of(new WordResult("think", 70, ErrorType.MISPRONUNCIATION, List.of(new PhonemeResult("θ", 40))))));
        when(confusions.findGeneralTips(any(), any())).thenThrow(new IllegalStateException("bảng mẹo lỗi"));
        UUID user = userAccountService.createLocal("hint-" + UUID.randomUUID() + "@x.com", "Hint", "h").id();
        Sentence sentence = sentence();

        mockMvc.perform(multipart("/api/v1/sentences/{id}/shadowing-attempts", sentence.getId())
                        .file(new MockMultipartFile("audio", "a.wav", "audio/wav", WavFixtures.valid(1_000)))
                        .headers(auth(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.score").value(70.0))
                .andExpect(jsonPath("$.data.words[0].phonemes[0].symbol").value("θ"))
                .andExpect(jsonPath("$.data.words[0].phonemes[0].tip").value((Object) null))
                // lượt vẫn tính: đã lưu và bộ đếm không bị hoàn
                .andExpect(jsonPath("$.data.usage.used").value(1));

        assertThat(jdbc.queryForObject("SELECT count(*) FROM sentence_attempts WHERE user_id = ?", Integer.class, user))
                .isEqualTo(1);
    }

    private HttpHeaders auth(UUID user) {
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtTokenService.issueAccessToken(user, Role.STUDENT, UUID.randomUUID()).token());
        return headers;
    }

    private Sentence sentence() {
        String tag = UUID.randomUUID().toString().substring(0, 8);
        Topic topic = new Topic();
        topic.setSlug("hint-t-" + tag);
        topic.setName("hint topic");
        topic = topics.save(topic);

        Lesson lesson = new Lesson();
        lesson.setTopic(topic);
        lesson.setSlug("hint-" + tag);
        lesson.setTitle("hint " + tag);
        lesson.setDifficulty(CefrLevel.B1);
        lesson.setPro(false);
        lesson.setStatus(LessonStatus.APPROVED);
        lesson = lessons.save(lesson);

        Sentence s = new Sentence();
        s.setLesson(lesson);
        s.setSortOrder(0);
        s.setText("Think");
        s.setStartMs(0);
        s.setEndMs(900);
        s.setCefrLevel(CefrLevel.A1);
        return sentences.save(s);
    }
}
