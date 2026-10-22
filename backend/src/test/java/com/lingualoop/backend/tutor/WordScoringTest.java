package com.lingualoop.backend.tutor;

import static com.lingualoop.backend.tutor.Results.mismatch;
import static com.lingualoop.backend.tutor.Results.ph;
import static com.lingualoop.backend.tutor.Results.sentence;
import static com.lingualoop.backend.tutor.Results.word;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class WordScoringTest {

    private static PracticeWord practice(String word, String phoneme) {
        return new PracticeWord(word, phoneme, 40, null);
    }

    @Test
    void usesTheScoreOfTheFocusPhoneme() {
        var retry = sentence(word("think", 90, ph("θ", 85), ph("ɪ", 60)));

        assertThat(WordScoring.scoreOf(retry, practice("think", "θ"))).isEqualTo(85);
    }

    @Test
    void aWordWithoutAPhonemeIsScoredByTheWholeAssessment() {
        assertThat(WordScoring.scoreOf(new SentenceResult(72, List.of()), practice("the", null))).isEqualTo(72);
    }

    @Test
    void aConsonantStillReportedAsAnotherOneCannotPassEvenWithAHighScore_BR_TUTOR_01() {
        // Đọc lại "if" vẫn ra "iv": Azure vẫn chấm 100 nhưng lượt không được đạt (dưới 80)
        var retry = sentence(word("if", 100, ph("ɪ", 100), mismatch("f", 100)));

        double score = WordScoring.scoreOf(retry, practice("if", "f"));

        assertThat(score).isEqualTo(TutorThresholds.PHONEME_ERROR_SCORE - 1);
        assertThat(score).isLessThan(TutorThresholds.PASS_SCORE);
    }

    @Test
    void whenTheSameSoundAppearsTwiceTheWorseOneCounts() {
        var retry = sentence(word("sister", 80, ph("s", 95), ph("s", 55)));

        assertThat(WordScoring.scoreOf(retry, practice("sister", "s"))).isEqualTo(55);
    }

    @Test
    void ifAzureReturnedADifferentWordItSearchesEveryWord() {
        var retry = sentence(word("tink", 60, ph("θ", 70)));

        assertThat(WordScoring.scoreOf(retry, practice("think", "θ"))).isEqualTo(70);
    }

    @Test
    void aMissingPhonemeScoresZero() {
        assertThat(WordScoring.scoreOf(sentence(word("think", 60, ph("ɪ", 70))), practice("think", "θ"))).isZero();
    }
}
