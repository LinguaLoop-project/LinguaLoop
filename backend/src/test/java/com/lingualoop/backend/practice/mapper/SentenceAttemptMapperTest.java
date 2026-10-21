package com.lingualoop.backend.practice.mapper;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.mapstruct.factory.Mappers;
import org.springframework.test.util.ReflectionTestUtils;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.DictationAttemptView;
import com.lingualoop.backend.practice.dto.request.AttemptWordRequest;
import com.lingualoop.backend.practice.dto.request.DictationAttemptRequest;
import com.lingualoop.backend.practice.entity.SentenceAttempt;
import com.lingualoop.backend.practice.entity.SentenceAttemptWord;
import com.lingualoop.backend.practice.enums.AttemptOutcome;
import com.lingualoop.backend.practice.enums.AttemptWordClass;
import com.lingualoop.backend.practice.enums.DictationLevel;

class SentenceAttemptMapperTest {

    private final SentenceAttemptMapper mapper = Mappers.getMapper(SentenceAttemptMapper.class);

    @Test
    void toEntity_mapsEveryFieldAndWordsAndLeavesDatabaseManagedFieldsEmpty() {
        UUID user = UUID.randomUUID();
        UUID sentence = UUID.randomUUID();
        DictationAttemptRequest request = new DictationAttemptRequest(user, sentence, DictationLevel.easy,
                new BigDecimal("0.75"), 2, 4200, true, false, "typed", new BigDecimal("66.67"),
                List.of(new AttemptWordRequest(0, "the", "the", AttemptOutcome.correct, AttemptWordClass.function),
                        new AttemptWordRequest(3, null, "very", AttemptOutcome.inserted, null)));

        SentenceAttempt attempt = mapper.toEntity(request);

        assertThat(attempt.getId()).isNull();
        assertThat(attempt.getAttemptedAt()).isNull();
        assertThat(attempt.getMode()).isEqualTo(PracticeMode.dictation);
        assertThat(attempt.getUserId()).isEqualTo(user);
        assertThat(attempt.getSentenceId()).isEqualTo(sentence);
        assertThat(attempt.getLevel()).isEqualTo(DictationLevel.easy);
        assertThat(attempt.getPlaybackRate()).isEqualByComparingTo("0.75");
        assertThat(attempt.getReplayCount()).isEqualTo(2);
        assertThat(attempt.getDurationMs()).isEqualTo(4200);
        assertThat(attempt.isRetry()).isTrue();
        assertThat(attempt.isGaveUp()).isFalse();
        assertThat(attempt.getSubmittedText()).isEqualTo("typed");
        assertThat(attempt.getScore()).isEqualByComparingTo("66.67");
        assertThat(attempt.getWords()).hasSize(2);
        SentenceAttemptWord first = attempt.getWords().get(0);
        assertThat(first.getId()).isNull();
        assertThat(first.getPosition()).isZero();
        assertThat(first.getExpectedWord()).isEqualTo("the");
        assertThat(first.getActualWord()).isEqualTo("the");
        assertThat(first.getOutcome()).isEqualTo(AttemptOutcome.correct);
        assertThat(first.getExpectedWordClass()).isEqualTo(AttemptWordClass.function);
        SentenceAttemptWord inserted = attempt.getWords().get(1);
        assertThat(inserted.getExpectedWord()).isNull();
        assertThat(inserted.getExpectedWordClass()).isNull();
    }

    @Test
    void toEntity_withNoWords_givesEmptyMutableWords() {
        DictationAttemptRequest request = new DictationAttemptRequest(UUID.randomUUID(), UUID.randomUUID(),
                DictationLevel.normal, null, 0, null, false, true, null, BigDecimal.ZERO, List.of());

        SentenceAttempt attempt = mapper.toEntity(request);

        assertThat(attempt.getWords()).isEmpty();
        assertThat(attempt.isGaveUp()).isTrue();
    }

    @Test
    void toView_mapsIdToAttemptIdAndKeepsFlags() {
        UUID sentence = UUID.randomUUID();
        Instant at = Instant.now();
        SentenceAttempt attempt = new SentenceAttempt();
        ReflectionTestUtils.setField(attempt, "id", 42L);
        ReflectionTestUtils.setField(attempt, "attemptedAt", at);
        attempt.setSentenceId(sentence);
        attempt.setLevel(DictationLevel.hard);
        attempt.setScore(new BigDecimal("90.00"));
        attempt.setRetry(true);
        attempt.setGaveUp(true);

        DictationAttemptView view = mapper.toView(attempt);

        assertThat(view.attemptId()).isEqualTo(42L);
        assertThat(view.sentenceId()).isEqualTo(sentence);
        assertThat(view.level()).isEqualTo(DictationLevel.hard);
        assertThat(view.score()).isEqualByComparingTo("90.00");
        assertThat(view.retry()).isTrue();
        assertThat(view.gaveUp()).isTrue();
        assertThat(view.attemptedAt()).isEqualTo(at);
    }

    @Test
    void toBlankPositions_returnsPositionsInAscendingOrder() {
        SentenceAttempt attempt = new SentenceAttempt();
        for (int position : new int[] {4, 1, 3}) {
            SentenceAttemptWord word = new SentenceAttemptWord();
            word.setPosition(position);
            attempt.getWords().add(word);
        }

        assertThat(mapper.toBlankPositions(attempt)).containsExactly(1, 3, 4);
        assertThat(mapper.toBlankPositions(new SentenceAttempt())).isEmpty();
    }
}
