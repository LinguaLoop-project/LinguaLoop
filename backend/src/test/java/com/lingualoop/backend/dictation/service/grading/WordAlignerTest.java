package com.lingualoop.backend.dictation.service.grading;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

class WordAlignerTest {

    private final WordAligner aligner = new WordAligner(new EquivalenceTable());

    @Test
    void align_identicalSentences() {
        assertThat(aligner.align(List.of("meet", "me", "at"), List.of("meet", "me", "at"))).containsExactly(
                new AlignedPair(0, "meet", true), new AlignedPair(1, "me", true), new AlignedPair(2, "at", true));
    }

    @Test
    void align_missingWords() {
        assertThat(aligner.align(List.of("meet", "me", "at", "the", "station"), List.of("meet", "at", "station")))
                .containsExactly(
                        new AlignedPair(0, "meet", true), new AlignedPair(1, null, false),
                        new AlignedPair(2, "at", true), new AlignedPair(3, null, false),
                        new AlignedPair(4, "station", true));
    }

    @Test
    void align_extraWord() {
        assertThat(aligner.align(List.of("meet", "me", "at", "the", "station"),
                List.of("meet", "me", "at", "the", "old", "station")))
                .containsExactly(
                        new AlignedPair(0, "meet", true), new AlignedPair(1, "me", true),
                        new AlignedPair(2, "at", true), new AlignedPair(3, "the", true),
                        new AlignedPair(null, "old", false), new AlignedPair(4, "station", true));
    }

    @Test
    void align_substitution() {
        assertThat(aligner.align(List.of("fifteen"), List.of("fifty")))
                .containsExactly(new AlignedPair(0, "fifty", false));
    }

    @Test
    void align_mergesTwoExpectedIntoOneTyped() {
        assertThat(aligner.align(List.of("da", "nang"), List.of("danang"))).containsExactly(
                new AlignedPair(0, "danang", true), new AlignedPair(1, "danang", true));
        assertThat(aligner.align(List.of("a", "lot"), List.of("alot"))).containsExactly(
                new AlignedPair(0, "alot", true), new AlignedPair(1, "alot", true));
    }

    @Test
    void align_splitsOneExpectedIntoTwoTyped() {
        assertThat(aligner.align(List.of("i'd", "like"), List.of("i", "would", "like"))).containsExactly(
                new AlignedPair(0, "i would", true), new AlignedPair(1, "like", true));
    }

    @Test
    void align_numberEquivalence() {
        assertThat(aligner.align(List.of("15"), List.of("fifteen")))
                .containsExactly(new AlignedPair(0, "fifteen", true));
    }

    @Test
    void align_repeatedWords() {
        assertThat(aligner.align(List.of("the"), List.of("the", "the", "the"))).containsExactly(
                new AlignedPair(0, "the", true), new AlignedPair(null, "the", false),
                new AlignedPair(null, "the", false));
    }

    @Test
    void align_emptySides() {
        assertThat(aligner.align(List.of(), List.of("a", "b"))).containsExactly(
                new AlignedPair(null, "a", false), new AlignedPair(null, "b", false));
        assertThat(aligner.align(List.of("a", "b"), List.of())).containsExactly(
                new AlignedPair(0, null, false), new AlignedPair(1, null, false));
        assertThat(aligner.align(List.of(), List.of())).isEmpty();
    }

    @Test
    void align_isDeterministic() {
        List<String> expected = List.of("the", "cat", "sat", "on", "the", "mat");
        List<String> typed = List.of("the", "the", "cat", "sat", "mat");

        assertThat(aligner.align(expected, typed)).isEqualTo(aligner.align(expected, typed));
    }

    @Test
    void editDistance_countsCharacterEdits() {
        assertThat(EditDistance.levenshtein("oat", "out")).isEqualTo(1);
        assertThat(EditDistance.levenshtein("fifteen", "fifty")).isEqualTo(3);
        assertThat(EditDistance.levenshtein("", "abc")).isEqualTo(3);
        assertThat(EditDistance.levenshtein("same", "same")).isZero();
    }
}
