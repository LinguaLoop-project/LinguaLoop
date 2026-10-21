package com.lingualoop.backend.dictation.service.exercise;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.OptionalInt;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.dictation.service.token.GradingTestSupport;
import com.lingualoop.backend.dictation.service.token.SentenceToken;
import com.lingualoop.backend.dictation.service.grading.EquivalenceTable;
import com.lingualoop.backend.dictation.service.grading.HomophoneTable;
import com.lingualoop.backend.dictation.service.grading.OutcomeResolver;

class NextWordFinderTest {

    private final EquivalenceTable equivalences = new EquivalenceTable();
    private final NextWordFinder finder = new NextWordFinder(new OutcomeResolver(equivalences, new HomophoneTable()));

    private static List<SentenceToken> words(String sentence) {
        return GradingTestSupport.tokenService().tokenize(sentence).stream()
                .filter(t -> !t.normalized().isEmpty()).toList();
    }

    @Test
    void firstUnmatchedIndex_isTheWordAfterTheCorrectPrefix() {
        assertThat(finder.firstUnmatchedIndex(words("So how are you getting along?"), "so how are you"))
                .isEqualTo(OptionalInt.of(4));
    }

    @Test
    void firstUnmatchedIndex_withNothingTypedIsTheFirstWord() {
        List<SentenceToken> sentence = words("So how are you");

        assertThat(finder.firstUnmatchedIndex(sentence, "")).isEqualTo(OptionalInt.of(0));
        assertThat(finder.firstUnmatchedIndex(sentence, null)).isEqualTo(OptionalInt.of(0));
        assertThat(finder.firstUnmatchedIndex(sentence, "   ")).isEqualTo(OptionalInt.of(0));
    }

    @Test
    void firstUnmatchedIndex_stopsAtTheFirstWrongWord() {
        assertThat(finder.firstUnmatchedIndex(words("So how are you"), "so how is you"))
                .isEqualTo(OptionalInt.of(2));
    }

    @Test
    void firstUnmatchedIndex_treatsAMisspelledWordAsNotMatched() {
        assertThat(finder.firstUnmatchedIndex(words("I like coffee"), "i like cofee"))
                .isEqualTo(OptionalInt.of(2));
    }

    @Test
    void firstUnmatchedIndex_ignoresCaseAndPunctuation() {
        assertThat(finder.firstUnmatchedIndex(words("Hello, my friend."), "HELLO my"))
                .isEqualTo(OptionalInt.of(2));
    }

    @Test
    void firstUnmatchedIndex_isEmptyWhenEveryWordIsAlreadyCorrect() {
        assertThat(finder.firstUnmatchedIndex(words("Oh wow"), "oh wow")).isEmpty();
        assertThat(finder.firstUnmatchedIndex(words("Oh wow"), "oh wow and more")).isEmpty();
    }
}
