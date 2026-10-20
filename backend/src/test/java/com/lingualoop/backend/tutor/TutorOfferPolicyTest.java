package com.lingualoop.backend.tutor;

import static com.lingualoop.backend.tutor.Results.clean;
import static com.lingualoop.backend.tutor.Results.mismatch;
import static com.lingualoop.backend.tutor.Results.ph;
import static com.lingualoop.backend.tutor.Results.sentence;
import static com.lingualoop.backend.tutor.Results.withPhonemeError;
import static com.lingualoop.backend.tutor.Results.word;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class TutorOfferPolicyTest {

    private final TutorOfferPolicy policy = new TutorOfferPolicy();

    private TutorOfferPolicy.Decision decide(SentenceResult current, List<SentenceResult> previous, Integer sinceLastOffer) {
        return policy.decide(new TutorOfferPolicy.Context(current, previous, sinceLastOffer));
    }

    private static SentenceResult lowWord() {
        return sentence(word("think", 45, ph("θ", 20), ph("ɪ", 80), ph("ŋ", 70), ph("k", 75)));
    }

    @Test
    void offersWhenAWordScoresBelow60_AC_TUTOR_01() {
        var d = decide(lowWord(), List.of(), null);

        assertThat(d.offer()).isTrue();
        assertThat(d.reason()).isEqualTo(TutorOfferPolicy.Reason.LOW_WORD_SCORE);
    }

    @Test
    void wordAtExactly60DoesNotTriggerALowWordOffer() {
        assertThat(decide(sentence(word("good", 60, ph("g", 90))), List.of(), null).offer()).isFalse();
    }

    @Test
    void offersWhenTheSameTargetPhonemeNeedsFixingInTwoOfTheLastThreeSentences_AC_TUTOR_02() {
        var d = decide(withPhonemeError("θ"), List.of(clean(), withPhonemeError("θ")), null);

        assertThat(d.offer()).isTrue();
        assertThat(d.reason()).isEqualTo(TutorOfferPolicy.Reason.REPEATED_PHONEME_ERROR);
    }

    @Test
    void aConsonantAzureKeepsReportingAsAnotherOneCountsAsARepeat() {
        // Điểm cao nên không từ nào dưới 60, nhưng /f/ cần sửa hai câu liền
        var current = sentence(word("if", 100, ph("ɪ", 100), mismatch("f", 100)));
        var previous = List.of(sentence(word("life", 100, mismatch("f", 100))));

        assertThat(decide(current, previous, null).reason()).isEqualTo(TutorOfferPolicy.Reason.REPEATED_PHONEME_ERROR);
    }

    @Test
    void ignoresRepeatsOlderThanTheWindow() {
        var previous = List.of(clean(), clean(), withPhonemeError("θ"));

        assertThat(decide(withPhonemeError("θ"), previous, null).offer()).isFalse();
    }

    @Test
    void doesNotOfferWhenTheRepeatedPhonemeIsAbsentFromTheCurrentSentence_AC_TUTOR_03() {
        var previous = List.of(withPhonemeError("θ"), withPhonemeError("θ"));

        assertThat(decide(clean(), previous, null).reason()).isEqualTo(TutorOfferPolicy.Reason.NO_SIGNIFICANT_ERROR);
    }

    @Test
    void differentPhonemeErrorsAreNotARepeat() {
        assertThat(decide(withPhonemeError("θ"), List.of(withPhonemeError("ʃ")), null).offer()).isFalse();
    }

    @Test
    void waitsThreeSentencesBetweenOffers_AC_TUTOR_04() {
        assertThat(decide(lowWord(), List.of(), 1).reason()).isEqualTo(TutorOfferPolicy.Reason.COOLDOWN);
        assertThat(decide(lowWord(), List.of(), 2).reason()).isEqualTo(TutorOfferPolicy.Reason.COOLDOWN);
        assertThat(decide(lowWord(), List.of(), 3).offer()).isTrue();
    }

    @Test
    void hasNoPerLessonCap() {
        assertThat(decide(lowWord(), List.of(), 30).offer()).isTrue();
    }

    @Test
    void anInsertedWordNeverTriggersAnOffer() {
        assertThat(decide(sentence(word("uh", 0, "inserted")), List.of(), null).offer()).isFalse();
    }

    @Test
    void handlesAnEmptyResult() {
        assertThat(decide(new SentenceResult(0, List.of()), null, null).offer()).isFalse();
    }
}
