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

/** Danh sách Câu cần ôn: tự thêm khi dưới 60 điểm, tự gỡ khi từ 80 điểm, ghim tay và gỡ tay. */
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
    void lowScore_addsTheSentence_withTheLatestScore() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("low");

        submit(user, sentence, "one");

        as(user, get(REVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].sentenceId").value(sentence.toString()))
                .andExpect(jsonPath("$.data[0].reason").value("low_score"))
                .andExpect(jsonPath("$.data[0].lastScore").value(20.0))
                .andExpect(jsonPath("$.data[0].lastLevel").value("hard"))
                .andExpect(jsonPath("$.data[0].text").value(TEXT))
                .andExpect(jsonPath("$.data[0].lessonSlug").value("low-" + tag));
    }

    @Test
    void sixtyPoints_isNotAddedButStaysWhenAlreadyInTheList() throws Exception {
        UUID user = data.newUser();
        UUID fresh = sentence("mid-new");
        UUID queued = sentence("mid-old");

        submit(user, fresh, "one two three");
        submit(user, queued, "one");
        submit(user, queued, "one two three");

        as(user, get(REVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].sentenceId").value(queued.toString()))
                .andExpect(jsonPath("$.data[0].lastScore").value(60.0));
    }

    @Test
    void eightyPointsOrMore_removesTheSentence_andAnotherLowScoreBringsItBack() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("good");

        submit(user, sentence, "one");
        submit(user, sentence, "one two three four five");
        as(user, get(REVIEW)).andExpect(jsonPath("$.data.length()").value(0));

        submit(user, sentence, "one");
        as(user, get(REVIEW)).andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void gaveUpAttempt_countsAsAZeroScore() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("gaveup");

        as(user, post("/api/v1/dictation/sentences/" + sentence + "/attempts")
                .contentType(MediaType.APPLICATION_JSON).content("{\"level\":\"hard\",\"gaveUp\":true}"))
                .andExpect(status().isOk());

        as(user, get(REVIEW)).andExpect(jsonPath("$.data[0].lastScore").value(0.0));
    }

    @Test
    void list_putsTheLowestLatestScoreFirst() throws Exception {
        UUID user = data.newUser();
        UUID twenty = sentence("order-a");
        UUID zero = sentence("order-b");

        submit(user, twenty, "one");
        submit(user, zero, "nothing like it");

        as(user, get(REVIEW)).andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].sentenceId").value(zero.toString()))
                .andExpect(jsonPath("$.data[1].sentenceId").value(twenty.toString()));
    }

    @Test
    void pin_requiresAnAttempt_thenKeepsEvenAGoodSentenceUntilResolved() throws Exception {
        UUID user = data.newUser();
        UUID sentence = sentence("pin");

        as(user, put(REVIEW + "/" + sentence)).andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.code").value("PRACTICE_SENTENCE_NOT_PRACTICED"));

        submit(user, sentence, "one two three four five");
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
    void lessonResponse_marksTheSentencesInTheList() throws Exception {
        UUID user = data.newUser();
        UUID lesson = data.newLesson("flag-" + tag, false, "APPROVED", false);
        UUID queued = data.newSentence(lesson, 0, TEXT, "Bản dịch");
        data.newSentence(lesson, 1, TEXT, "Bản dịch");

        submit(user, queued, "one");

        as(user, get("/api/v1/dictation/lessons/flag-" + tag)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sentences[0].inReview").value(true))
                .andExpect(jsonPath("$.data.sentences[1].inReview").value(false));
    }

    @Test
    void list_isPrivateToEachUser() throws Exception {
        UUID owner = data.newUser();
        UUID other = data.newUser();
        UUID sentence = sentence("private");

        submit(owner, sentence, "one");

        as(other, get(REVIEW)).andExpect(jsonPath("$.data.length()").value(0));
        as(other, delete(REVIEW + "/" + sentence)).andExpect(status().isOk());
        as(owner, get(REVIEW)).andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void list_requiresLogin() throws Exception {
        mockMvc.perform(get(REVIEW)).andExpect(status().isUnauthorized());
    }
}
