package com.lingualoop.backend.dictation.service.exercise;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.random.RandomGenerator;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import com.lingualoop.backend.dictation.service.token.GradingTestSupport;
import com.lingualoop.backend.dictation.service.token.SentenceToken;
import com.lingualoop.backend.dictation.service.token.WordClass;
import com.lingualoop.backend.practice.dto.ClassCountsView;

class BlankPickerTest {

    private static final String[] CONTENT_WORDS = {"apple", "bread", "cloud", "dream", "eagle", "flame", "grape",
            "house", "image", "juice", "knife", "lemon", "mango", "noble", "ocean", "piano", "queen", "river",
            "stone", "tiger"};

    private final BlankPicker picker = new BlankPicker();

    private static List<SentenceToken> tokens(String sentence) {
        return GradingTestSupport.tokenService().tokenize(sentence);
    }

    private static String contentSentence(int words) {
        return String.join(" ", List.of(CONTENT_WORDS).subList(0, words));
    }

    private List<Integer> pick(String sentence, long seed) {
        return picker.pick(tokens(sentence), Map.of(), List.of(), new Random(seed));
    }

    @ParameterizedTest(name = "{0} words -> {1} blanks")
    @CsvSource({"1,1", "2,1", "3,1", "4,2", "5,2", "6,2", "7,3", "8,3", "10,3", "20,3"})
    void blankCount_followsFortyPercentClampedToOneThroughThree(int words, int expected) {
        assertThat(picker.blankCount(tokens(contentSentence(words)))).isEqualTo(expected);
    }

    @Test
    void blankCount_isLimitedByBlankableWords() {
        assertThat(picker.blankCount(tokens("Oh wow"))).isZero();
        assertThat(picker.blankCount(tokens("We saw Anna"))).isEqualTo(1);
        assertThat(picker.blankCount(List.of())).isZero();
    }

    @Test
    void isBlankable_excludesOtherProperAndPunctuationOnlyTokens() {
        List<SentenceToken> oh = tokens("Oh");
        List<SentenceToken> anna = tokens("We saw Anna");
        List<SentenceToken> dash = tokens("Wait - what");
        assertThat(picker.isBlankable(oh.get(0))).isFalse();
        assertThat(picker.isBlankable(anna.get(2))).isFalse();
        assertThat(picker.isBlankable(dash.get(1))).isFalse();

        List<SentenceToken> ok = tokens("like the fifteen iced");
        assertThat(ok).allMatch(picker::isBlankable);
    }

    @Test
    void pick_returnsSortedPositionsWithinKAndOnlyBlankableWords() {
        List<SentenceToken> sentence = tokens(contentSentence(20));

        List<Integer> blanks = picker.pick(sentence, Map.of(), List.of(), new Random(3));

        assertThat(blanks).hasSize(3).isSorted();
        assertThat(blanks).allMatch(p -> picker.isBlankable(sentence.get(p)));
    }

    @Test
    void pick_singleWordSentence() {
        assertThat(pick("Hello", 1)).containsExactly(0);
        assertThat(pick("Thank you", 1)).hasSize(1);
    }

    @Test
    void pick_returnsEmptyWhenNothingIsBlankable() {
        assertThat(pick("Oh wow", 1)).isEmpty();
        assertThat(picker.pick(List.of(), Map.of(), List.of(), new Random(1))).isEmpty();
    }

    @Test
    void pick_isDeterministicForTheSameSeed() {
        String sentence = "I'd like a large iced latte with oat milk, please.";

        assertThat(pick(sentence, 7)).isEqualTo(pick(sentence, 7));
    }

    private static boolean adjacent(List<SentenceToken> sentence, int a, int b) {
        List<Integer> wordPositions = sentence.stream().filter(t -> !t.normalized().isEmpty())
                .map(SentenceToken::position).toList();
        return Math.abs(wordPositions.indexOf(a) - wordPositions.indexOf(b)) == 1;
    }

    @Test
    void pick_neverReturnsAdjacentBlanks() {
        for (String sentence : List.of("I'd like a large iced latte with oat milk, please.",
                "Could I get that to go?", "Please bring fresh bread to the table", "Wait - what is that sound")) {
            List<SentenceToken> parsed = tokens(sentence);
            for (long seed = 0; seed < 500; seed++) {
                List<Integer> blanks = picker.pick(parsed, Map.of(), List.of(), new Random(seed));
                for (int i = 0; i < blanks.size(); i++) {
                    for (int j = i + 1; j < blanks.size(); j++) {
                        assertThat(adjacent(parsed, blanks.get(i), blanks.get(j)))
                                .as("%s seed=%d blanks=%s", sentence, seed, blanks).isFalse();
                    }
                }
            }
        }
    }

    @Test
    void pick_includesBothFunctionAndContentWhenSentenceHasBoth() {
        for (String sentence : List.of("Could I get that to go?", "I'd like a large iced latte with oat milk, please.")) {
            List<SentenceToken> parsed = tokens(sentence);
            for (long seed = 0; seed < 500; seed++) {
                List<SentenceToken> blanks = picker.pick(parsed, Map.of(), List.of(), new Random(seed)).stream()
                        .map(parsed::get).toList();
                assertThat(blanks).as("%s seed=%d", sentence, seed)
                        .anyMatch(t -> t.wordClass() == WordClass.function)
                        .anyMatch(t -> t.wordClass() != WordClass.function);
            }
        }
        assertThat(pick("cat international dog airport sun", 4)).hasSize(2);
    }

    @Test
    void pick_prefersLongerWordsAfterTheFirstBlank() {
        RandomGenerator alwaysZero = () -> 0L;

        List<Integer> blanks = picker.pick(tokens("cat international dog airport sun"), Map.of(), List.of(),
                alwaysZero);

        assertThat(blanks).containsExactly(0, 3);
    }

    @Test
    void pick_returnsFewerThanKWhenAdjacencyMakesItImpossible() {
        List<SentenceToken> parsed = tokens("Oh oh cat dog");

        assertThat(picker.blankCount(parsed)).isEqualTo(2);
        assertThat(picker.pick(parsed, Map.of(), List.of(), new Random(1))).hasSize(1);
    }

    private int[] sharesOverTrials(Map<String, ClassCountsView> counts, int trials) {
        List<SentenceToken> sentence = tokens("The big dogs");
        Random random = new Random(42);
        int[] picked = new int[3];
        for (int i = 0; i < trials; i++) {
            picked[picker.pick(sentence, counts, List.of(), random).get(0)]++;
        }
        return picked;
    }

    @Test
    void pick_newLearnerPicksClassesEvenly() {
        int[] picked = sharesOverTrials(Map.of(), 3000);

        for (int count : picked) {
            assertThat(count).isBetween(850, 1150);
        }
    }

    @Test
    void pick_weakClassIsPickedMoreOften() {
        Map<String, ClassCountsView> counts = Map.of(
                "function", new ClassCountsView(10, 9),
                "content", new ClassCountsView(10, 1),
                "inflected", new ClassCountsView(10, 5));

        int[] picked = sharesOverTrials(counts, 3000);

        assertThat(picked[0] / 3000.0).isBetween(0.50, 0.62);
        assertThat(picked[2] / 3000.0).isBetween(0.28, 0.38);
        assertThat(picked[1] / 3000.0).isLessThan(0.16);
    }

    @Test
    void pick_survivesWeirdCounts() {
        List<SentenceToken> sentence = tokens("The big dogs");
        Map<String, ClassCountsView> weird = new HashMap<>();
        weird.put("function", new ClassCountsView(0, 5));
        weird.put("content", new ClassCountsView(3, 100));
        weird.put("inflected", new ClassCountsView(Long.MAX_VALUE, Long.MAX_VALUE));
        weird.put("number", null);
        weird.put("banana", new ClassCountsView(-3, -1));

        assertThat(picker.pick(sentence, weird, List.of(), new Random(1))).hasSize(1);
        assertThat(picker.pick(sentence, null, List.of(), new Random(1))).hasSize(1);
        assertThat(picker.pick(sentence, new HashMap<>(), null, new Random(1))).hasSize(1);
    }

    @Test
    void pick_avoidsRecentlyBlankedWordsWhenAlternativesExist() {
        List<SentenceToken> sentence = tokens("Please bring fresh bread to");

        for (long seed = 0; seed < 300; seed++) {
            assertThat(picker.pick(sentence, Map.of(), List.of(List.of(1, 3)), new Random(seed)))
                    .as("seed=%d", seed).hasSize(2).doesNotContain(1, 3);
        }
    }

    @Test
    void pick_fallsBackToRecentWordsWhenNothingElse() {
        assertThat(picker.pick(tokens("cat dog"), Map.of(), List.of(List.of(0, 1)), new Random(1))).hasSize(1);
    }

    @Test
    void pick_ignoresInvalidRecentPositions() {
        List<SentenceToken> sentence = tokens("Please bring fresh bread to");

        assertThat(picker.pick(sentence, Map.of(), List.of(List.of()), new Random(1))).hasSize(2);
        for (long seed = 0; seed < 100; seed++) {
            assertThat(picker.pick(sentence, Map.of(), List.of(List.of(-5, 99, 1, 1)), new Random(seed)))
                    .as("seed=%d", seed).hasSize(2).doesNotContain(1);
        }
    }
}
