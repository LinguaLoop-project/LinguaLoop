package com.lingualoop.backend.shadowing.controller;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment.ErrorType;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment.PhonemeResult;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment.WordResult;
import com.lingualoop.backend.shadowing.azure.PronunciationScoringService;
import com.lingualoop.backend.support.WavFixtures;

/**
 * UC-SHADOW-10..12: lịch sử lượt đọc, ghi chú dùng chung với nghe chép và Câu cần ôn của Shadowing. Azure được giả
 * lập nên điểm do test quyết định.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class})
class ShadowingReviewHistoryNotesIntegrationTest {

    private static final String TEXT = "Hello there.";

    @Autowired private MockMvc mockMvc;
    @Autowired private DictationTestData data;

    @MockitoBean private PronunciationScoringService scoring;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    @BeforeEach
    void defaults() {
    }

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user)));
    }

    private static PronunciationAssessment scored(double score) {
        return new PronunciationAssessment("hello there", score, score - 1, score - 2, 100, 60.0, List.of(
                new WordResult("hello", score, ErrorType.NONE, List.of(new PhonemeResult("h", score))),
                new WordResult("there", score, ErrorType.NONE, List.of(new PhonemeResult("ð", score)))));
    }

    /** Một lượt đọc được {@code score} điểm. */
    private ResultActions read(UUID user, UUID sentence, double score) throws Exception {
        when(scoring.assess(any(), any())).thenReturn(scored(score));
        return mockMvc.perform(multipart("/api/v1/sentences/{id}/shadowing-attempts", sentence)
                .file(new MockMultipartFile("audio", "a.wav", "audio/wav", WavFixtures.valid(1_500)))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user)))
                .andExpect(status().isOk());
    }

    /** Một lượt nghe chép gõ sai hoàn toàn (0 điểm). */
    private void dictate(UUID user, UUID sentence) throws Exception {
        as(user, post("/api/v1/dictation/sentences/" + sentence + "/attempts")
                .contentType(MediaType.APPLICATION_JSON).content("{\"level\":\"hard\",\"typedText\":\"zzz\"}"))
                .andExpect(status().isOk());
    }

    private UUID sentence(String name) {
        return data.newSentence(data.newLesson(name + "-" + tag, false, "APPROVED", false), 0, TEXT, "Xin chào");
    }

    private ResultActions saveNote(UUID user, UUID sentence, String mode, String content) throws Exception {
        return as(user, put("/api/v1/sentences/" + sentence + "/notes/" + mode).contentType(MediaType.APPLICATION_JSON)
                .content("{\"content\":\"" + content + "\"}"));
    }

    private ResultActions save(UUID user, UUID sentence) throws Exception {
        return as(user, put("/api/v1/review/shadowing/sentences/" + sentence).param("reason", "low_score"));
    }

    // ── UC-SHADOW-12: Câu cần ôn ────────────────────────────────────────────────────

    @Test
    void scores_neverChangeTheList_onTheirOwn_AC_SHADOW_46_47_48() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("hands-off");

        read(user, sentence, 40);   // dưới 60: không tự thêm (giao diện hỏi người học)
        as(user, get("/api/v1/review/shadowing/sentences")).andExpect(jsonPath("$.data.length()").value(0));

        save(user, sentence).andExpect(status().isOk());
        read(user, sentence, 90);   // từ 80: không tự gỡ
        read(user, sentence, 70);
        as(user, get("/api/v1/review/shadowing/sentences")).andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].lastScore").value(70.0));
    }

    @Test
    void save_afterALowScore_listsTheSentenceInShadowingOnly_AC_SHADOW_46() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("low");
        read(user, sentence, 40);

        save(user, sentence).andExpect(status().isOk());

        as(user, get("/api/v1/review/shadowing/sentences")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].sentenceId").value(sentence.toString()))
                .andExpect(jsonPath("$.data[0].mode").value("shadowing"))
                .andExpect(jsonPath("$.data[0].reason").value("low_score"))
                .andExpect(jsonPath("$.data[0].lastScore").value(40.0))
                .andExpect(jsonPath("$.data[0].lastLevel").doesNotExist());
        as(user, get("/api/v1/review/dictation/sentences")).andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void pin_needsAShadowingAttempt_thenPinsAndUnpinsIdempotently_AC_SHADOW_49() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("pin");
        String url = "/api/v1/review/shadowing/sentences/" + sentence;

        as(user, put(url)).andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PRACTICE_SENTENCE_NOT_PRACTICED"));
        dictate(user, sentence); // một lượt nghe chép không đủ để ghim ở Shadowing
        as(user, put(url)).andExpect(status().isUnprocessableEntity());

        read(user, sentence, 90);
        as(user, put(url)).andExpect(status().isOk());
        as(user, put(url)).andExpect(status().isOk());
        as(user, get("/api/v1/review/shadowing/sentences")).andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].reason").value("manual"))
                .andExpect(jsonPath("$.data[0].lastScore").value(90.0));

        as(user, delete(url)).andExpect(status().isOk());
        as(user, delete(url)).andExpect(status().isOk());
        as(user, get("/api/v1/review/shadowing/sentences")).andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void theTwoModesAreIndependent_AC_SHADOW_50() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("both");
        dictate(user, sentence);
        read(user, sentence, 20);

        as(user, put("/api/v1/review/dictation/sentences/" + sentence).param("reason", "low_score"))
                .andExpect(status().isOk());
        as(user, get("/api/v1/review/shadowing/sentences")).andExpect(jsonPath("$.data.length()").value(0));

        save(user, sentence).andExpect(status().isOk());
        as(user, delete("/api/v1/review/dictation/sentences/" + sentence)).andExpect(status().isOk());
        as(user, get("/api/v1/review/dictation/sentences")).andExpect(jsonPath("$.data.length()").value(0));
        as(user, get("/api/v1/review/shadowing/sentences")).andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void combinedList_carriesTheModeOfEachRow_andFiltersByLesson_AC_SHADOW_52() throws Exception {
        UUID user = data.newUser();
        UUID dictated = sentence("mix-d");
        UUID read = sentence("mix-s");
        dictate(user, dictated);
        read(user, read, 30);
        as(user, put("/api/v1/review/dictation/sentences/" + dictated)).andExpect(status().isOk());
        save(user, read).andExpect(status().isOk());

        as(user, get("/api/v1/review/sentences")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                // điểm thấp trước: nghe chép 0, Shadowing 30
                .andExpect(jsonPath("$.data[0].mode").value("dictation"))
                .andExpect(jsonPath("$.data[1].mode").value("shadowing"));
        as(user, get("/api/v1/review/sentences").param("lessonSlug", "mix-s-" + tag))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].sentenceId").value(read.toString()))
                .andExpect(jsonPath("$.data[0].lessonSlug").value("mix-s-" + tag));
    }

    @Test
    void unknownMode_isRejected_andListsArePrivate() throws Exception {
        UUID owner = data.newUser();
        UUID other = data.newUser();
        UUID sentence = sentence("priv");
        read(owner, sentence, 30);
        save(owner, sentence).andExpect(status().isOk());

        as(owner, get("/api/v1/review/karaoke/sentences")).andExpect(status().isBadRequest());
        as(other, get("/api/v1/review/shadowing/sentences")).andExpect(jsonPath("$.data.length()").value(0));
        as(other, delete("/api/v1/review/shadowing/sentences/" + sentence)).andExpect(status().isOk());
        as(owner, get("/api/v1/review/shadowing/sentences")).andExpect(jsonPath("$.data.length()").value(1));
    }

    // ── UC-SHADOW-11: Ghi chú theo chế độ ───────────────────────────────────────────

    @Test
    void shadowingNote_needsAShadowingAttempt_AC_SHADOW_44() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("note-need");

        saveNote(user, sentence, "shadowing", "chưa đọc").andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PRACTICE_SENTENCE_NOT_PRACTICED"));
        dictate(user, sentence); // lượt nghe chép không đủ để ghi chú ở Shadowing
        saveNote(user, sentence, "shadowing", "chưa đọc").andExpect(status().isUnprocessableEntity());

        read(user, sentence, 80);
        saveNote(user, sentence, "shadowing", "nối âm ở cuối").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mode").value("shadowing"));
    }

    @Test
    void notesOfTheTwoModes_areIndependent_AC_SHADOW_43_56() throws Exception {
        UUID user = data.newUser();
        UUID lesson = data.newLesson("note-" + tag, false, "APPROVED", false);
        UUID sentence = data.newSentence(lesson, 0, TEXT, "Xin chào");
        read(user, sentence, 80);
        dictate(user, sentence);

        saveNote(user, sentence, "shadowing", "nối âm ở cuối").andExpect(status().isOk());
        saveNote(user, sentence, "dictation", "nghe nhầm từ hai").andExpect(status().isOk());
        saveNote(user, sentence, "dictation", "nghe nhầm từ ba").andExpect(status().isOk());

        as(user, get("/api/v1/sentences/" + sentence + "/notes/shadowing"))
                .andExpect(jsonPath("$.data.content").value("nối âm ở cuối"));
        as(user, get("/api/v1/notes")).andExpect(jsonPath("$.data.length()").value(2));
        as(user, get("/api/v1/notes").param("mode", "shadowing"))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].mode").value("shadowing"))
                .andExpect(jsonPath("$.data[0].content").value("nối âm ở cuối"));
        // màn nghe chép chỉ thấy ghi chú của nghe chép
        as(user, get("/api/v1/dictation/lessons/note-" + tag))
                .andExpect(jsonPath("$.data.sentences[0].note").value("nghe nhầm từ ba"));

        as(user, delete("/api/v1/sentences/" + sentence + "/notes/dictation")).andExpect(status().isOk());
        as(user, get("/api/v1/sentences/" + sentence + "/notes/shadowing"))
                .andExpect(jsonPath("$.data.content").value("nối âm ở cuối"));
    }

    // ── UC-SHADOW-10: Lịch sử ───────────────────────────────────────────────────────

    @Test
    void history_listsEveryAttemptNewestFirst_withSubScores_AC_SHADOW_40() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("hist");
        read(user, sentence, 40);
        read(user, sentence, 70);
        read(user, sentence, 90);

        as(user, get("/api/v1/sentences/" + sentence + "/shadowing-attempts")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[0].score").value(90.0))
                .andExpect(jsonPath("$.data[0].accuracy").value(89.0))
                .andExpect(jsonPath("$.data[0].fluency").value(88.0))
                .andExpect(jsonPath("$.data[0].completeness").value(100.0))
                .andExpect(jsonPath("$.data[0].prosody").value(60.0))
                .andExpect(jsonPath("$.data[1].score").value(70.0))
                .andExpect(jsonPath("$.data[2].score").value(40.0));
    }

    @Test
    void history_isEmptyForASentenceNeverRead_andForeignSentencesAreNotMixedIn() throws Exception {
        UUID user = data.newUser();
        UUID other = data.newUser();
        UUID sentence = sentence("hist-empty");
        read(other, sentence, 50);

        as(user, get("/api/v1/sentences/" + sentence + "/shadowing-attempts")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void attempt_opensAnOldAttemptWithItsOwnWords_notTheLatest_AC_SHADOW_41() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("old");
        String first = read(user, sentence, 40).andReturn().getResponse().getContentAsString();
        read(user, sentence, 90);
        long firstId = ((Number) com.jayway.jsonpath.JsonPath.read(first, "$.data.attemptId")).longValue();

        as(user, get("/api/v1/shadowing-attempts/" + firstId)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.attemptId").value(firstId))
                .andExpect(jsonPath("$.data.score").value(40.0))
                .andExpect(jsonPath("$.data.sentenceId").value(sentence.toString()))
                .andExpect(jsonPath("$.data.words.length()").value(2))
                .andExpect(jsonPath("$.data.words[0].word").value("hello"))
                .andExpect(jsonPath("$.data.words[0].phonemes[0].accuracy").value(40.0))
                .andExpect(jsonPath("$.data.attemptCount").value(2))
                .andExpect(jsonPath("$.data.bestScore").value(90.0));
    }

    @Test
    void attempt_isNotFoundForAnotherUsersAttemptOrAnUnknownId_AC_SHADOW_42() throws Exception {
        UUID owner = data.newUser();
        UUID other = data.newUser();
        UUID sentence = sentence("foreign");
        String made = read(owner, sentence, 40).andReturn().getResponse().getContentAsString();
        long id = ((Number) com.jayway.jsonpath.JsonPath.read(made, "$.data.attemptId")).longValue();

        as(other, get("/api/v1/shadowing-attempts/" + id)).andExpect(status().isNotFound());
        as(owner, get("/api/v1/shadowing-attempts/999999999")).andExpect(status().isNotFound());
    }

    @Test
    void historyAndReview_requireLogin() throws Exception {
        mockMvc.perform(get("/api/v1/review/sentences")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/sentences/" + UUID.randomUUID() + "/shadowing-attempts"))
                .andExpect(status().isUnauthorized());
    }
}
