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

/** Tiến độ nghe chép và điểm cao nhất từng câu mà feature lesson hiển thị. */
@SpringBootTest
@Import({TestcontainersConfiguration.class, AttemptTestData.class})
class PracticeProgressQueryServiceIntegrationTest {

    @Autowired private PracticeProgressQueryService service;
    @Autowired private AttemptTestData data;

    @Test
    void countDictationSentencesDone_countsEachSentenceOnceNoMatterHowManyAttempts() {
        UUID user = data.newUser();
        UUID lesson = data.newLesson();
        UUID first = data.newSentence(lesson, 0);
        UUID second = data.newSentence(lesson, 1);
        data.newSentence(lesson, 2);
        data.insertAttempt(user, first, "normal", false, false, Instant.now());
        data.insertAttempt(user, first, "normal", true, false, Instant.now());
        data.insertAttempt(user, second, "hard", false, false, Instant.now());

        assertThat(service.countDictationSentencesDone(user, List.of(lesson))).containsExactly(
                java.util.Map.entry(lesson, 2));
    }

    @Test
    void countDictationSentencesDone_countsRetryGaveUpAndEveryLevel() {
        UUID user = data.newUser();
        UUID lesson = data.newLesson();
        data.insertAttempt(user, data.newSentence(lesson, 0), "easy", false, false, Instant.now());
        data.insertAttempt(user, data.newSentence(lesson, 1), "normal", true, false, Instant.now());
        data.insertAttempt(user, data.newSentence(lesson, 2), "hard", false, true, Instant.now());

        assertThat(service.countDictationSentencesDone(user, List.of(lesson))).containsEntry(lesson, 3);
    }

    @Test
    void countDictationSentencesDone_ignoresShadowingAttemptsOtherUsersAndOtherLessons() {
        UUID user = data.newUser();
        UUID lesson = data.newLesson();
        UUID other = data.newLesson();
        UUID shadowed = data.newSentence(lesson, 0);
        UUID done = data.newSentence(lesson, 1);
        data.insertAttempt(user, shadowed, "shadowing", null, false, false, Instant.now());
        data.insertAttempt(user, done, "normal", false, false, Instant.now());
        data.insertAttempt(data.newUser(), shadowed, "normal", false, false, Instant.now());
        data.insertAttempt(user, data.newSentence(other, 0), "normal", false, false, Instant.now());

        assertThat(service.countDictationSentencesDone(user, List.of(lesson))).containsOnlyKeys(lesson)
                .containsEntry(lesson, 1);
    }

    @Test
    void countDictationSentencesDone_answersSeveralLessonsAndOmitsUntouchedOnes() {
        UUID user = data.newUser();
        UUID touched = data.newLesson();
        UUID untouched = data.newLesson();
        data.newSentence(untouched, 0);
        data.insertAttempt(user, data.newSentence(touched, 0), "normal", false, false, Instant.now());

        assertThat(service.countDictationSentencesDone(user, List.of(touched, untouched)))
                .containsOnlyKeys(touched);
    }

    @Test
    void countDictationSentencesDone_withNoLessonIdsReturnsEmptyMap() {
        assertThat(service.countDictationSentencesDone(data.newUser(), List.of())).isEmpty();
    }

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
