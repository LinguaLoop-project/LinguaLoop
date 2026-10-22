package com.lingualoop.backend.tutor;

import static com.lingualoop.backend.tutor.Results.clean;
import static com.lingualoop.backend.tutor.Results.mismatch;
import static com.lingualoop.backend.tutor.Results.ph;
import static com.lingualoop.backend.tutor.Results.sentence;
import static com.lingualoop.backend.tutor.Results.withPhonemeError;
import static com.lingualoop.backend.tutor.Results.word;
import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.junit.jupiter.api.Test;

class PracticeWordSelectorTest {

    private static final Map<String, String> TIPS = Map.of("θ", "mẹo θ", "ʃ", "mẹo ʃ", "f", "mẹo f", "ð", "mẹo ð");

    private final PracticeWordSelector selector =
            new PracticeWordSelector(phoneme -> phoneme == null ? Optional.empty() : Optional.ofNullable(TIPS.get(phoneme)));

    private static List<String> words(List<PracticeWord> list) {
        return list.stream().map(PracticeWord::word).toList();
    }

    @Test
    void listsEveryWordWithAnErrorNotJustOne() {
        var current = sentence(
                word("think", 45, ph("θ", 45)),
                word("she", 40, ph("ʃ", 30)),
                word("good", 95, ph("g", 95)));

        var list = selector.select(current, List.of());

        assertThat(words(list)).containsExactly("she", "think"); // điểm thấp trước
        assertThat(list.get(0).tipVi()).isEqualTo("mẹo ʃ");
    }

    @Test
    void aConsonantAzureReportedAsAnotherOneComesFirstEvenWithAHighScore() {
        // "if" đọc thành "iv": Azure chấm 100 cho /v/ nhưng âm đích /f/ vẫn cần sửa
        var current = sentence(
                word("think", 45, ph("θ", 20)),
                word("if", 100, ph("ɪ", 100), mismatch("f", 100)));

        var list = selector.select(current, List.of());

        assertThat(words(list)).containsExactly("if", "think");
        assertThat(list.get(0).phoneme()).isEqualTo("f");
        assertThat(list.get(0).score()).isEqualTo(100);
        assertThat(list.get(0).tipVi()).isEqualTo("mẹo f");
    }

    @Test
    void repeatedErrorOutranksLowerScore() {
        var current = sentence(
                word("think", 50, ph("θ", 50)),
                word("she", 50, ph("ʃ", 30)));
        var previous = List.of(withPhonemeError("θ"), withPhonemeError("θ"));

        assertThat(words(selector.select(current, previous))).containsExactly("think", "she");
    }

    @Test
    void sameWordTwiceAppearsOnceWithItsWorstPhoneme() {
        var current = sentence(
                word("Think", 50, ph("θ", 50)),
                word("think,", 40, ph("θ", 30)));

        var list = selector.select(current, List.of());

        assertThat(list).hasSize(1);
        assertThat(list.get(0).score()).isEqualTo(30);
    }

    @Test
    void includesLowScoringWordWhenNoPhonemeNeedsFixing() {
        var current = sentence(
                word("good", 90, ph("g", 90)),
                word("very", 55, ph("v", 65), ph("e", 80), ph("r", 70)));

        var list = selector.select(current, List.of());

        assertThat(words(list)).containsExactly("very");
        assertThat(list.get(0).phoneme()).isEqualTo("v");
    }

    @Test
    void returnsEmptyForACleanSentence() {
        assertThat(selector.select(clean(), List.of())).isEmpty();
    }

    @Test
    void tipIsNullForAPhonemeWithoutAnEntry() {
        var list = selector.select(sentence(word("sing", 40, ph("ŋ", 20))), null);

        assertThat(list.get(0).phoneme()).isEqualTo("ŋ");
        assertThat(list.get(0).tipVi()).isNull();
    }

    @Test
    void anOmittedWordIsListedWithoutAPhonemeAndScoredByTheWholeWord() {
        var list = selector.select(sentence(word("the", 0, "omitted")), List.of());

        assertThat(list).hasSize(1);
        assertThat(list.get(0).word()).isEqualTo("the");
        assertThat(list.get(0).phoneme()).isNull();
        assertThat(list.get(0).tipVi()).isNull();
    }

    @Test
    void anInsertedWordIsNeverListedBecauseItIsNotInTheSentence() {
        var current = sentence(word("uh", 0, "inserted"), word("think", 45, ph("θ", 45)));

        assertThat(words(selector.select(current, List.of()))).containsExactly("think");
    }

    @Test
    void aWordWithoutPhonemesButGoodScoreIsNotListed() {
        assertThat(selector.select(sentence(word("the", 90, "correct")), List.of())).isEmpty();
    }

    @Test
    void capsTheListAtEightWords() {
        List<SentenceResult.Word> many = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            many.add(word("w" + (char) ('a' + i), 30, ph("θ", 10 + i)));
        }

        assertThat(selector.select(new SentenceResult(50, many), List.of())).hasSize(TutorThresholds.MAX_PRACTICE_WORDS);
    }

    // --- forWord: từ người học tự chọn ---

    @Test
    void forWordPrefersThePhonemeThatNeedsFixingOverOneWithALowerScoreThatIsFine() {
        var sentence = sentence(word("if", 100, ph("ɪ", 85), mismatch("f", 100)));

        var pick = selector.forWord(sentence, "if");

        assertThat(pick.phoneme()).isEqualTo("f");
        assertThat(pick.tipVi()).isEqualTo("mẹo f");
    }

    @Test
    void forWordUsesLowestPhonemeEvenForAGoodWord() {
        var sentence = sentence(word("brother", 88, ph("b", 95), ph("ð", 82), ph("ə", 90)));

        var pick = selector.forWord(sentence, "brother");

        assertThat(pick.phoneme()).isEqualTo("ð");
        assertThat(pick.score()).isEqualTo(82);
        assertThat(pick.tipVi()).isEqualTo("mẹo ð");
    }

    @Test
    void forWordMatchesIgnoringCaseAndPunctuation() {
        assertThat(selector.forWord(sentence(word("Think", 45, ph("θ", 20))), "think").phoneme()).isEqualTo("θ");
    }

    @Test
    void forWordWithoutPhonemesFallsBackToWordScore() {
        var pick = selector.forWord(sentence(word("the", 35, "omitted")), "the");

        assertThat(pick.phoneme()).isNull();
        assertThat(pick.score()).isEqualTo(35);
    }

    @Test
    void forWordMissingFromTheSentenceIsZeroWithNoPhoneme() {
        var pick = selector.forWord(clean(), "missing");

        assertThat(pick.word()).isEqualTo("missing");
        assertThat(pick.phoneme()).isNull();
        assertThat(pick.score()).isZero();
    }
}
