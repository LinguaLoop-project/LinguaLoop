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
import com.lingualoop.backend.practice.dto.DictationAttemptDetailView;
import com.lingualoop.backend.practice.dto.request.AttemptWordRequest;
import com.lingualoop.backend.practice.dto.request.DictationAttemptRequest;
import com.lingualoop.backend.practice.enums.AttemptOutcome;
import com.lingualoop.backend.practice.enums.AttemptWordClass;
import com.lingualoop.backend.practice.enums.DictationLevel;

/** Đọc lại lượt nghe chép gần nhất của một câu kèm kết quả từng từ (để mở lại câu đã làm). */
@SpringBootTest
@Import({TestcontainersConfiguration.class, AttemptTestData.class})
class LatestDictationAttemptIntegrationTest {

    @Autowired private PracticeAttemptService service;
    @Autowired private AttemptTestData data;

    private long record(UUID user, UUID sentence, DictationLevel level, boolean retry, boolean gaveUp, String score,
            AttemptWordRequest... words) {
        return service.recordDictationAttempt(new DictationAttemptRequest(user, sentence, level, null, 0, null, retry,
                gaveUp, null, new BigDecimal(score), List.of(words)));
    }

    @Test
    void findLatestDictationAttempt_returnsTheNewestAttemptWithItsWordsInPositionOrder() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        record(user, sentence, DictationLevel.normal, false, false, "20",
                new AttemptWordRequest(0, "old", null, AttemptOutcome.omitted, AttemptWordClass.content));
        long newest = record(user, sentence, DictationLevel.hard, true, false, "66.67",
                new AttemptWordRequest(2, "coffee", "cofee", AttemptOutcome.misspelled, AttemptWordClass.content),
                new AttemptWordRequest(0, "i", "i", AttemptOutcome.correct, AttemptWordClass.function),
                new AttemptWordRequest(3, null, "very", AttemptOutcome.inserted, null));

        DictationAttemptDetailView view = service.findLatestDictationAttempt(user, sentence).orElseThrow();

        assertThat(view.attemptId()).isEqualTo(newest);
        assertThat(view.sentenceId()).isEqualTo(sentence);
        assertThat(view.level()).isEqualTo(DictationLevel.hard);
        assertThat(view.score()).isEqualByComparingTo("66.67");
        assertThat(view.retry()).isTrue();
        assertThat(view.gaveUp()).isFalse();
        assertThat(view.words()).extracting("position").containsExactly(0, 2, 3);
        assertThat(view.words().get(1).expectedWord()).isEqualTo("coffee");
        assertThat(view.words().get(1).actualWord()).isEqualTo("cofee");
        assertThat(view.words().get(1).outcome()).isEqualTo(AttemptOutcome.misspelled);
        assertThat(view.words().get(1).wordClass()).isEqualTo(AttemptWordClass.content);
        assertThat(view.words().get(2).expectedWord()).isNull();
        assertThat(view.words().get(2).wordClass()).isNull();
    }

    @Test
    void findLatestDictationAttempt_withTwoAttemptsAtTheSameInstantTakesTheLaterOne() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        data.insertAttempt(user, sentence, "normal", false, false, Instant.parse("2026-01-01T00:00:00Z"));
        long later = data.insertAttempt(user, sentence, "normal", false, false, Instant.parse("2026-01-01T00:00:00Z"));

        assertThat(service.findLatestDictationAttempt(user, sentence).orElseThrow().attemptId()).isEqualTo(later);
    }

    @Test
    void findLatestDictationAttempt_isEmptyWithoutAnyDictationAttemptOfThisUser() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        data.insertAttempt(user, sentence, "shadowing", null, false, false, Instant.now());
        data.insertAttempt(data.newUser(), sentence, "normal", false, false, Instant.now());

        assertThat(service.findLatestDictationAttempt(user, sentence)).isEmpty();
    }

    @Test
    void findLatestDictationAttempt_ofAGaveUpAttemptWithNoWordsHasAnEmptyWordList() {
        UUID user = data.newUser();
        UUID sentence = data.newSentence(data.newLesson(), 0);
        record(user, sentence, DictationLevel.normal, false, true, "0");

        DictationAttemptDetailView view = service.findLatestDictationAttempt(user, sentence).orElseThrow();

        assertThat(view.gaveUp()).isTrue();
        assertThat(view.words()).isEmpty();
    }
}
