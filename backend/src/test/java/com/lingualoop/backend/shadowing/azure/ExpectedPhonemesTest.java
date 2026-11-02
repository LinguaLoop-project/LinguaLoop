package com.lingualoop.backend.shadowing.azure;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.List;

import org.junit.jupiter.api.Test;

class ExpectedPhonemesTest {

    @Test
    void splitsEachWordIntoTableSymbols_longestFirst() {
        assertThat(ExpectedPhonemes.ofSentence("if chair see", "/ɪf tʃɛɹ si/"))
                .containsExactly(List.of("ɪ", "f"), List.of("tʃ", "ɛɹ"), List.of("s", "i"));
    }

    @Test
    void ignoresStressMarksAndNormalisesVariants() {
        assertThat(ExpectedPhonemes.tokenize("ˈɡɹeɪt")).containsExactly("g", "ɹ", "eɪ", "t");
    }

    @Test
    void vowelPlusR_isOneSoundBeforeAConsonantOrAtTheEnd_likeAzure() {
        assertThat(ExpectedPhonemes.tokenize("pɑɹk")).containsExactly("p", "ɑ", "k");
        assertThat(ExpectedPhonemes.tokenize("nɪɹ")).containsExactly("n", "ɪɹ");
        assertThat(ExpectedPhonemes.tokenize("kɛɹi")).containsExactly("k", "ɛɹ", "ɹ", "i");
    }

    @Test
    void realSentenceMeasuredFromAzure_hasTheSameSoundCountPerWord() {
        // Số âm mỗi từ Azure trả cho "I can't park the car near here" (đo từ Azure thật)
        List<List<String>> expected = ExpectedPhonemes.ofSentence(
                "I can't park the car near here", "/aɪ kænt pɑɹk ðə kɑɹ nɪɹ hɪɹ/");
        assertThat(expected).extracting(List::size).containsExactly(1, 4, 3, 2, 2, 2, 2);
    }

    @Test
    void unknownCharacterOrWordCountMismatch_givesNothingToAvoidWrongAssignment() {
        assertThat(ExpectedPhonemes.tokenize("ɪʔ")).isNull();
        assertThat(ExpectedPhonemes.ofSentence("if only", "ɪf")).isNull();
        assertThat(ExpectedPhonemes.ofSentence("if", null)).isNull();
    }

    @Test
    void americanSentenceIpa_isTheSameSymbolsAsAzureOutput() {
        assertThat(ExpectedPhonemes.tokenize("stoʊnz")).containsExactly("s", "t", "oʊ", "n", "z");
        assertThat(ExpectedPhonemes.tokenize("ˈlɝn")).containsExactly("l", "ɝ", "n");
        assertThat(ExpectedPhonemes.tokenize("hɑt")).containsExactly("h", "ɑ", "t");
    }

    @Test
    void punctuationOnlyTokensAreNotWords_ADR_0007() {
        assertThat(ExpectedPhonemes.wordsOf("Pierre just called -")).containsExactly("Pierre", "just", "called");
        assertThat(ExpectedPhonemes.ofSentence("Pierre just called -", "piɛɹ dʒʌst kɔld"))
                .extracting(List::size).containsExactly(3, 4, 4); // ɛɹ gộp thành một âm như Azure
        assertThat(ExpectedPhonemes.ofSentence("It costs 5 dollars", "ɪt kɔsts faɪv dɑlɚz")).hasSize(4);
    }

    @Test
    void nonBreakingSpaceSeparatesWordsLikeAnyOtherSpace_ADR_0007() {
        // Lời thoại của vài bài có U+00A0 giữa các từ; \s của Java không tính nó nên từng gộp hai từ thành một
        assertThat(ExpectedPhonemes.wordsOf("I've looked everywhere!")).containsExactly("I've", "looked", "everywhere!");
        assertThat(ExpectedPhonemes.ofSentence(" looked everywhere!", "lʊkt ˈɛvɹiˌwɛɹ")).hasSize(2);
    }

    @Test
    void unstressedRColouredVowel_keepsItsOwnSymbol_ADR_0007() {
        assertThat(ExpectedPhonemes.tokenize("dɪˈlɪvɚ")).containsExactly("d", "ɪ", "l", "ɪ", "v", "ɚ");
    }

    @Test
    void align_pairsByPositionOnlyWhenCountsMatch() {
        assertThat(ExpectedPhonemes.align(List.of("ɪ", "f"), 2)).containsExactly("ɪ", "f");
        assertThat(ExpectedPhonemes.align(List.of("ɪ", "f"), 3)).isEqualTo(Arrays.asList(null, null, null));
        assertThat(ExpectedPhonemes.align(null, 1)).isEqualTo(Arrays.asList((String) null));
    }
}
