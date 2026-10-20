package com.lingualoop.backend.tutor;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static com.lingualoop.backend.tutor.AttemptRule.NextStep;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class AttemptRuleTest {

    private final AttemptRule rule = new AttemptRule();

    @ParameterizedTest
    @ValueSource(ints = {1, 2, 3})
    void passingMovesToNextWordWhenOthersArePending(int attempt) {
        var d = rule.afterWordAttempt(attempt, 85, true);

        assertThat(d.passed()).isTrue();
        assertThat(d.exhausted()).isFalse();
        assertThat(d.nextStep()).isEqualTo(NextStep.NEXT_WORD);
    }

    @Test
    void passingTheLastWordAsksForTheWholeSentence() {
        assertThat(rule.afterWordAttempt(1, 90, false).nextStep()).isEqualTo(NextStep.SENTENCE);
    }

    @Test
    void scoreOfExactly80Passes() {
        assertThat(rule.afterWordAttempt(1, 80, true).passed()).isTrue();
        assertThat(rule.afterWordAttempt(1, 79.9, true).passed()).isFalse();
    }

    @ParameterizedTest
    @ValueSource(ints = {1, 2})
    void failingBeforeTheLastAttemptRetriesTheSameWord(int attempt) {
        var d = rule.afterWordAttempt(attempt, 50, true);

        assertThat(d.passed()).isFalse();
        assertThat(d.exhausted()).isFalse();
        assertThat(d.nextStep()).isEqualTo(NextStep.RETRY_WORD);
    }

    @Test
    void failingTheThirdAttemptMarksExhaustedAndMovesOn() {
        var withMore = rule.afterWordAttempt(3, 50, true);
        var last = rule.afterWordAttempt(3, 50, false);

        assertThat(withMore.exhausted()).isTrue();
        assertThat(withMore.nextStep()).isEqualTo(NextStep.NEXT_WORD);
        assertThat(last.exhausted()).isTrue();
        assertThat(last.nextStep()).isEqualTo(NextStep.SENTENCE);
    }

    @Test
    void sentenceAttemptEndsOnlyWhenNoWordIsPending() {
        assertThat(rule.afterSentenceAttempt(false)).isEqualTo(NextStep.END);
        assertThat(rule.afterSentenceAttempt(true)).isEqualTo(NextStep.NEXT_WORD);
    }

    @Test
    void rejectsAttemptNumberOutsideRange() {
        assertThatThrownBy(() -> rule.afterWordAttempt(0, 90, true)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> rule.afterWordAttempt(4, 90, true)).isInstanceOf(IllegalArgumentException.class);
    }
}
