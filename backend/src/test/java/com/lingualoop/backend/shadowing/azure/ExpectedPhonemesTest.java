package com.lingualoop.backend.shadowing.azure;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

class ExpectedPhonemesTest {

    @Test
    void splitsEachWordIntoTableSymbols_longestFirst() {
        assertThat(ExpectedPhonemes.ofSentence("if chair see", "/ɪf tʃeə siː/"))
                .containsExactly(List.of("ɪ", "f"), List.of("tʃ", "eə"), List.of("s", "iː"));
    }

    @Test
    void ignoresStressMarksAndNormalisesVariants() {
        assertThat(ExpectedPhonemes.tokenize("ˈɡɹeɪt")).containsExactly("g", "r", "eɪ", "t");
    }

    @Test
    void unknownCharacterOrWordCountMismatch_givesNothingToAvoidWrongAssignment() {
        assertThat(ExpectedPhonemes.tokenize("ɪʔ")).isNull();
        assertThat(ExpectedPhonemes.ofSentence("if only", "ɪf")).isNull();
        assertThat(ExpectedPhonemes.ofSentence("if", null)).isNull();
    }

    @Test
    void americanSentenceIpa_isConvertedToTableSymbolsLikeAzureOutput() {
        assertThat(ExpectedPhonemes.tokenize("stoʊnz")).containsExactly("s", "t", "əʊ", "n", "z");
        assertThat(ExpectedPhonemes.tokenize("ˈlɝn")).containsExactly("l", "ɜː", "n");
        assertThat(ExpectedPhonemes.tokenize("hɑt")).containsExactly("h", "ɑː", "t");
    }

    @Test
    void align_pairsByPositionOnlyWhenCountsMatch() {
        assertThat(ExpectedPhonemes.align(List.of("ɪ", "f"), 2)).containsExactly("ɪ", "f");
        assertThat(ExpectedPhonemes.align(List.of("ɪ", "f"), 3)).isEqualTo(Arrays.asList(null, null, null));
        assertThat(ExpectedPhonemes.align(null, 1)).isEqualTo(Arrays.asList((String) null));
    }
}
