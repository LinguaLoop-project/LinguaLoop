package com.lingualoop.backend.practice.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;

/**
 * Câu cần ôn của nghe chép: hệ thống không tự thêm hay tự gỡ (BR-DICT-14, BR-DICT-15); câu chỉ vào danh sách khi
 * người học lưu hoặc ghim, và chỉ rời khi người học bỏ.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class})
class SentenceReviewApiIntegrationTest {

    private static final String REVIEW = "/api/v1/review/dictation/sentences";
    private static final String TEXT = "One two three four five.";

    @Autowired private MockMvc mockMvc;
    @Autowired private DictationTestData data;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user)));
    }

    private void submit(UUID user, UUID sentence, String typedText) throws Exception {
        as(user, post("/api/v1/dictation/sentences/" + sentence + "/attempts")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"level\":\"hard\",\"typedText\":\"" + typedText + "\"}")).andExpect(status().isOk());
    }

    private UUID sentence(String name) {
        return data.newSentence(data.newLesson(name + "-" + tag, false, "APPROVED", false), 0, TEXT, "Bản dịch");
    }

    @Test
    void scores_neverChangeTheList_onTheirOwn_AC_DICT_54_55_56() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("hands-off");

        submit(user, sentence, "one");                       // 20 điểm: không tự thêm
        as(user, get(REVIEW)).andExpect(jsonPath("$.data.length()").value(0));

        as(user, put(REVIEW + "/" + sentence).param("reason", "low_score")).andExpect(status().isOk());
        submit(user, sentence, "one two three four five");   // 100 điểm: không tự gỡ
        submit(user, sentence, "one two three");             // 60 điểm: không đổi
        as(user, get(REVIEW)).andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].lastScore").value(60.0));
    }

    @Test
    void save_afterALowScore_listsTheSentenceWithTheLowScoreReason_AC_DICT_54() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("low");
        submit(user, sentence, "one");

        as(user, put(REVIEW + "/" + sentence).param("reason", "low_score")).andExpect(status().isOk());

        as(user, get(REVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].sentenceId").value(sentence.toString()))
                .andExpect(jsonPath("$.data[0].mode").value("dictation"))
                .andExpect(jsonPath("$.data[0].reason").value("low_score"))
                .andExpect(jsonPath("$.data[0].lastScore").value(20.0))
                .andExpect(jsonPath("$.data[0].lastLevel").value("hard"))
                .andExpect(jsonPath("$.data[0].text").value(TEXT))
                .andExpect(jsonPath("$.data[0].lessonSlug").value("low-" + tag));
    }

    @Test
    void gaveUpAttempt_isAScoreOfZeroForTheList() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("gaveup");
        as(user, post("/api/v1/dictation/sentences/" + sentence + "/attempts")
                .contentType(MediaType.APPLICATION_JSON).content("{\"level\":\"hard\",\"gaveUp\":true}"))
                .andExpect(status().isOk());

        as(user, put(REVIEW + "/" + sentence).param("reason", "low_score")).andExpect(status().isOk());

        as(user, get(REVIEW)).andExpect(jsonPath("$.data[0].lastScore").value(0.0));
    }

    @Test
    void list_putsTheLowestLatestScoreFirst_AC_DICT_58() throws Exception {
        UUID user = data.newUser();
        UUID twenty = sentence("order-a");
        UUID zero = sentence("order-b");
        submit(user, twenty, "one");
        submit(user, zero, "nothing like it");
        as(user, put(REVIEW + "/" + twenty)).andExpect(status().isOk());
        as(user, put(REVIEW + "/" + zero)).andExpect(status().isOk());

        as(user, get(REVIEW)).andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].sentenceId").value(zero.toString()))
                .andExpect(jsonPath("$.data[1].sentenceId").value(twenty.toString()));
    }

    @Test
    void pin_requiresAnAttempt_defaultsToManual_andRejectsOtherReasons_AC_DICT_57() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("pin");

        as(user, put(REVIEW + "/" + sentence)).andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PRACTICE_SENTENCE_NOT_PRACTICED"));

        submit(user, sentence, "one two three four five");
        as(user, put(REVIEW + "/" + sentence).param("reason", "replayed_often")).andExpect(status().isBadRequest());
        as(user, put(REVIEW + "/" + sentence)).andExpect(status().isOk());
        as(user, put(REVIEW + "/" + sentence)).andExpect(status().isOk());

        as(user, get(REVIEW)).andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].reason").value("manual"))
                .andExpect(jsonPath("$.data[0].lastScore").value(100.0));

        as(user, delete(REVIEW + "/" + sentence)).andExpect(status().isOk());
        as(user, delete(REVIEW + "/" + sentence)).andExpect(status().isOk());
        as(user, get(REVIEW)).andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void savingAgain_keepsTheOriginalReason() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("keep");
        submit(user, sentence, "one");

        as(user, put(REVIEW + "/" + sentence).param("reason", "low_score")).andExpect(status().isOk());
        as(user, put(REVIEW + "/" + sentence)).andExpect(status().isOk());

        as(user, get(REVIEW)).andExpect(jsonPath("$.data[0].reason").value("low_score"));
    }

    @Test
    void lessonResponse_marksTheSentencesInTheList() throws Exception {
        UUID user = data.newUser();
        UUID lesson = data.newLesson("flag-" + tag, false, "APPROVED", false);
        UUID queued = data.newSentence(lesson, 0, TEXT, "Bản dịch");
        data.newSentence(lesson, 1, TEXT, "Bản dịch");
        submit(user, queued, "one");
        as(user, put(REVIEW + "/" + queued).param("reason", "low_score")).andExpect(status().isOk());

        as(user, get("/api/v1/dictation/lessons/flag-" + tag)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sentences[0].inReview").value(true))
                .andExpect(jsonPath("$.data.sentences[1].inReview").value(false));
    }

    @Test
    void list_isPrivateToEachUser_AC_DICT_61() throws Exception {
        UUID owner = data.newUser();
        UUID other = data.newUser();
        UUID sentence = sentence("private");
        submit(owner, sentence, "one");
        as(owner, put(REVIEW + "/" + sentence)).andExpect(status().isOk());

        as(other, get(REVIEW)).andExpect(jsonPath("$.data.length()").value(0));
        as(other, delete(REVIEW + "/" + sentence)).andExpect(status().isOk());
        as(owner, get(REVIEW)).andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void list_requiresLogin() throws Exception {
        mockMvc.perform(get(REVIEW)).andExpect(status().isUnauthorized());
    }
}
