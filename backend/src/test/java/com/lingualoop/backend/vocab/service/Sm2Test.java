package com.lingualoop.backend.vocab.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.vocab.enums.CardStatus;

/** SM-2 và trạng thái thẻ (BR-VOCAB-06, BR-VOCAB-07, BR-VOCAB-08). */
class Sm2Test {

    @Test
    void firstRepetition_isOneDay_forAnyPassingGrade_BR_VOCAB_07() {
        for (int quality : new int[] {3, 4, 5}) {
            Sm2.Result result = Sm2.grade(Sm2.State.FRESH, quality);
            assertThat(result.state().repetitions()).isEqualTo(1);
            assertThat(result.state().intervalDays()).isEqualTo(1);
            assertThat(result.delay()).isEqualTo(Duration.ofDays(1));
            assertThat(result.status()).isEqualTo(CardStatus.LEARNING);
        }
    }

    @Test
    void secondRepetition_isSixDays_thenIntervalTimesEasiness() {
        Sm2.State first = Sm2.grade(Sm2.State.FRESH, 4).state();
        Sm2.Result second = Sm2.grade(first, 4);
        assertThat(second.state().intervalDays()).isEqualTo(6);
        assertThat(second.status()).isEqualTo(CardStatus.REVIEWING);

        Sm2.Result third = Sm2.grade(second.state(), 4);
        assertThat(third.state().repetitions()).isEqualTo(3);
        assertThat(third.state().intervalDays()).isEqualTo(15); // 6 x 2,5
        assertThat(third.status()).isEqualTo(CardStatus.REVIEWING);
    }

    @Test
    void easiness_followsTheFormula_andNeverDropsBelowOnePointThree() {
        assertThat(Sm2.grade(Sm2.State.FRESH, 5).state().easiness()).isEqualTo(2.6);
        assertThat(Sm2.grade(Sm2.State.FRESH, 4).state().easiness()).isEqualTo(2.5);
        assertThat(Sm2.grade(Sm2.State.FRESH, 3).state().easiness()).isEqualTo(2.36);
        Sm2.State low = new Sm2.State(3, 10, 1.3);
        assertThat(Sm2.grade(low, 1).state().easiness()).isEqualTo(1.3);
    }

    @Test
    void forgetting_resetsRepetitions_andRetriesInTenMinutes_BR_VOCAB_07() {
        Sm2.Result result = Sm2.grade(new Sm2.State(5, 40, 2.5), 1);
        assertThat(result.state().repetitions()).isZero();
        assertThat(result.state().intervalDays()).isZero();
        assertThat(result.delay()).isEqualTo(Duration.ofMinutes(10));
        assertThat(result.status()).isEqualTo(CardStatus.LEARNING);
    }

    @Test
    void masteredFromTwentyOneDays_BR_VOCAB_06() {
        assertThat(Sm2.statusOf(4, 20)).isEqualTo(CardStatus.REVIEWING);
        assertThat(Sm2.statusOf(4, 21)).isEqualTo(CardStatus.MASTERED);
        assertThat(Sm2.statusOf(1, 1)).isEqualTo(CardStatus.LEARNING);
        assertThat(Sm2.statusOf(2, 6)).isEqualTo(CardStatus.REVIEWING);
    }

    @Test
    void firstAnswerOutsideFlashcard_isLearningOneDay_BR_VOCAB_08() {
        Sm2.Result result = Sm2.firstAnswer();
        assertThat(result.status()).isEqualTo(CardStatus.LEARNING);
        assertThat(result.delay()).isEqualTo(Duration.ofDays(1));
        assertThat(result.state().repetitions()).isEqualTo(1);
    }

    @Test
    void qualityOutOfRange_isRejected() {
        assertThatThrownBy(() -> Sm2.grade(Sm2.State.FRESH, 6)).isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> Sm2.grade(Sm2.State.FRESH, -1)).isInstanceOf(IllegalArgumentException.class);
    }
}
