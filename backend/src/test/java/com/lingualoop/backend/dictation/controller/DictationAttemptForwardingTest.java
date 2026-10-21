package com.lingualoop.backend.dictation.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.math.BigDecimal;
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
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.lesson.service.LessonProgressService;
import com.lingualoop.backend.practice.dto.request.AttemptWordRequest;
import com.lingualoop.backend.practice.dto.request.DictationAttemptRequest;
import com.lingualoop.backend.practice.enums.AttemptOutcome;
import com.lingualoop.backend.practice.enums.AttemptWordClass;
import com.lingualoop.backend.practice.enums.DictationLevel;
import com.lingualoop.backend.practice.service.PracticeAttemptService;

/** Kiểm tra dữ liệu dictation chuyển cho feature practice và lesson đúng như hợp đồng. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class})
class DictationAttemptForwardingTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private DictationTestData data;
    @MockitoBean private PracticeAttemptService practiceAttempts;
    @MockitoBean private LessonProgressService lessonProgress;

    private UUID lesson;

    @BeforeEach
    void setUp() {
        when(practiceAttempts.recordDictationAttempt(any())).thenReturn(77L);
    }

    private UUID sentence(String text) {
        lesson = data.newLesson("fw-" + UUID.randomUUID().toString().substring(0, 12), false, "APPROVED", false);
        return data.newSentence(lesson, 0, text, "dịch");
    }

    private ResultActions submit(UUID sentence, String json) throws Exception {
        return mockMvc.perform(post("/api/v1/dictation/sentences/" + sentence + "/attempts")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(data.newUser()))
                .contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private DictationAttemptRequest forwarded() {
        ArgumentCaptor<DictationAttemptRequest> captor = ArgumentCaptor.forClass(DictationAttemptRequest.class);
        verify(practiceAttempts).recordDictationAttempt(captor.capture());
        return captor.getValue();
    }

    @Test
    void submit_normal_forwardsExactDataAndRecordsActivity() throws Exception {
        UUID sentence = sentence("Could I get that to go?");

        submit(sentence, """
                {"level":"normal","typedText":"could I get that","playbackRate":0.75,"replayCount":2,
                 "durationMs":4200,"retry":true}""")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.attemptId").value(77))
                .andExpect(jsonPath("$.data.score").value(66.67));

        DictationAttemptRequest request = forwarded();
        assertThat(request.sentenceId()).isEqualTo(sentence);
        assertThat(request.level()).isEqualTo(DictationLevel.normal);
        assertThat(request.playbackRate()).isEqualByComparingTo("0.75");
        assertThat(request.replayCount()).isEqualTo(2);
        assertThat(request.durationMs()).isEqualTo(4200);
        assertThat(request.retry()).isTrue();
        assertThat(request.gaveUp()).isFalse();
        assertThat(request.submittedText()).isEqualTo("could I get that");
        assertThat(request.score()).isEqualByComparingTo(new BigDecimal("66.67"));
        assertThat(request.words()).extracting(AttemptWordRequest::position).containsExactly(0, 1, 2, 3, 4, 5);
        assertThat(request.words()).extracting(AttemptWordRequest::outcome).containsExactly(
                AttemptOutcome.correct, AttemptOutcome.correct, AttemptOutcome.correct, AttemptOutcome.correct,
                AttemptOutcome.omitted, AttemptOutcome.omitted);
        assertThat(request.words().get(0).expectedWordClass()).isEqualTo(AttemptWordClass.function);
        verify(lessonProgress).recordActivity(eq(request.userId()), eq(lesson), eq(PracticeMode.dictation), eq(4));
    }

    @Test
    void submit_easy_forwardsOnlyBlankWords() throws Exception {
        UUID sentence = sentence("I'd like a large iced latte.");

        submit(sentence, "{\"level\":\"easy\",\"blankPositions\":[1,4],\"blanks\":{\"1\":\"like\",\"4\":\"iced\"}}")
                .andExpect(status().isOk());

        DictationAttemptRequest request = forwarded();
        assertThat(request.level()).isEqualTo(DictationLevel.easy);
        assertThat(request.submittedText()).isNull();
        assertThat(request.words()).extracting(AttemptWordRequest::position).containsExactly(1, 4);
        assertThat(request.words()).extracting(AttemptWordRequest::expectedWord).containsExactly("like", "iced");
        assertThat(request.words()).extracting(AttemptWordRequest::outcome).containsOnly(AttemptOutcome.correct);
    }

    @Test
    void submit_withExtraWords_forwardsInsertedWordsAtPositionsAfterTheSentence() throws Exception {
        UUID sentence = sentence("Hello there");

        submit(sentence, "{\"level\":\"hard\",\"typedText\":\"hello there x y z\"}").andExpect(status().isOk());

        List<AttemptWordRequest> words = forwarded().words();
        assertThat(words).hasSize(5);
        List<AttemptWordRequest> inserted = words.subList(2, 5);
        assertThat(inserted).extracting(AttemptWordRequest::position).containsExactly(2, 3, 4);
        assertThat(inserted).extracting(AttemptWordRequest::outcome).containsOnly(AttemptOutcome.inserted);
        assertThat(inserted).extracting(AttemptWordRequest::expectedWord).containsOnlyNulls();
        assertThat(inserted).extracting(AttemptWordRequest::expectedWordClass).containsOnlyNulls();
        assertThat(inserted).extracting(AttemptWordRequest::actualWord).containsExactly("x", "y", "z");
    }

    @Test
    void submit_withoutDuration_recordsZeroSeconds() throws Exception {
        UUID sentence = sentence("Hello there");

        submit(sentence, "{\"level\":\"hard\",\"typedText\":\"hello there\"}").andExpect(status().isOk());

        verify(lessonProgress).recordActivity(any(), eq(lesson), eq(PracticeMode.dictation), eq(0));
    }
}
