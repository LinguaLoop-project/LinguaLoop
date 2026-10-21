package com.lingualoop.backend.practice.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.practice.AttemptTestData;

/** Điểm cao nhất từng câu mà feature lesson hiển thị. */
@SpringBootTest
@Import({TestcontainersConfiguration.class, AttemptTestData.class})
class PracticeProgressQueryServiceIntegrationTest {

    @Autowired private PracticeProgressQueryService service;
    @Autowired private AttemptTestData data;

    @Test
    void bestScores_isTheHighestScoreAcrossAttemptsAndModes() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        data.setScore(data.insertAttempt(user, sentence, "normal", false, false, Instant.now()), "40.00");
        data.setScore(data.insertAttempt(user, sentence, "hard", false, false, Instant.now()), "85.50");
        data.setScore(data.insertAttempt(user, sentence, "shadowing", null, false, false, Instant.now()), "70.00");

        assertThat(service.bestScores(user, List.of(sentence))).containsOnlyKeys(sentence);
        assertThat(service.bestScores(user, List.of(sentence)).get(sentence)).isEqualByComparingTo(new BigDecimal("85.50"));
    }

    @Test
    void bestScores_skipsSentencesWithoutScoreOtherUsersAndSentencesNotAsked() {
        UUID user = data.newUser();
        UUID lesson = data.newLesson();
        UUID scored = data.newSentence(lesson, 0);
        UUID unscored = data.newSentence(lesson, 1);
        UUID notAsked = data.newSentence(lesson, 2);
        data.setScore(data.insertAttempt(user, scored, "normal", false, false, Instant.now()), "60.00");
        data.insertAttempt(user, unscored, "normal", false, false, Instant.now());
        data.setScore(data.insertAttempt(user, notAsked, "normal", false, false, Instant.now()), "90.00");
        data.setScore(data.insertAttempt(data.newUser(), unscored, "normal", false, false, Instant.now()), "100.00");

        assertThat(service.bestScores(user, List.of(scored, unscored))).containsOnlyKeys(scored);
        assertThat(service.bestScores(user, List.of())).isEmpty();
    }
}
