package com.lingualoop.backend.shadowing.azure;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

class AzurePhonemeMapperTest {

    /** 44 âm giọng Mỹ của bảng {@code phonemes} (V2 và V20261031_2300, ADR 0007). */
    private static final Set<String> TABLE = Set.of(
            "p", "b", "t", "d", "k", "g", "f", "v", "θ", "ð", "s", "z", "ʃ", "ʒ", "h", "tʃ", "dʒ",
            "m", "n", "ŋ", "l", "ɹ", "j", "w",
            "i", "ɪ", "ɛ", "æ", "ʌ", "ɑ", "ɔ", "ʊ", "u", "ɝ", "ə", "ɚ",
            "eɪ", "aɪ", "ɔɪ", "aʊ", "oʊ", "ɪɹ", "ɛɹ", "ʊɹ");

    /** Bộ âm IPA mà Azure trả cho en-US (tài liệu "Phonemes of en-US"), cả hai dạng chữ g. */
    private static final List<String> AZURE_EN_US = List.of(
            "b", "d", "dʒ", "ð", "f", "g", "ɡ", "h", "j", "k", "l", "m", "n", "ŋ", "p", "ɹ", "s", "ʃ", "t", "tʃ",
            "θ", "v", "w", "z", "ʒ",
            "ə", "ɚ", "æ", "aɪ", "aʊ", "ɑ", "ɛ", "eɪ", "ɝ", "ɪ", "i", "oʊ", "ɔ", "ɔɪ", "ʊ", "u", "ʌ",
            // nguyên âm kèm r thành một âm (đo được từ Azure thật: "ɔɹ" ở "morning")
            "ɔɹ", "ɑɹ", "ɛɹ", "ɪɹ", "ʊɹ");

    private static List<String> map(String... azure) {
        return AzurePhonemeMapper.toTableSymbols(Arrays.asList(azure));
    }

    @Test
    void everyAzureEnUsPhoneme_mapsToTableSymbol_AC_SHADOW_12() {
        for (String symbol : AZURE_EN_US) {
            List<String> mapped = map(symbol);
            assertThat(mapped).as("Azure '%s'", symbol).hasSize(1);
            assertThat(mapped.get(0)).as("Azure '%s'", symbol).isNotNull().isIn(TABLE);
        }
    }

    @Test
    void azureSymbolsAreKeptAsTheyAre_exceptSpellingVariants_ADR_0007() {
        for (String symbol : List.of("oʊ", "ɝ", "ɚ", "ɹ", "i", "u", "ɛ", "ɑ", "ɔ", "ə", "ɪɹ", "ɛɹ", "ʊɹ")) {
            assertThat(map(symbol)).as("Azure '%s'", symbol).containsExactly(symbol);
        }
        assertThat(map("ɡ")).containsExactly("g");
        assertThat(map("r")).containsExactly("ɹ");
        assertThat(map("ɜ")).containsExactly("ɝ");
    }

    @Test
    void vowelBeforeR_becomesRColouredVowelAndKeepsR_AC_SHADOW_13() {
        assertThat(map("n", "ɪ", "ɹ")).containsExactly("n", "ɪɹ", "ɹ");      // near
        assertThat(map("s", "k", "w", "ɛ", "ɹ")).containsExactly("s", "k", "w", "ɛɹ", "ɹ"); // square
        assertThat(map("k", "j", "ʊ", "ɹ")).containsExactly("k", "j", "ʊɹ", "ɹ");           // cure
    }

    @Test
    void rColouredVowelAsOneSymbol_keepsItsRowOrFallsBackToTheVowel_AC_SHADOW_13() {
        assertThat(map("n", "ɪɹ")).containsExactly("n", "ɪɹ");                // near (đo từ Azure thật)
        assertThat(map("w", "ɛɹ")).containsExactly("w", "ɛɹ");                // where
        assertThat(map("p", "ʊɹ")).containsExactly("p", "ʊɹ");                // pure
        assertThat(map("m", "ɔɹ", "n")).containsExactly("m", "ɔ", "n");       // morning: không có hàng riêng, giữ nguyên âm
        assertThat(map("ɑɹ")).containsExactly("ɑ");                           // car
        assertThat(map("ˈɔɹ")).containsExactly("ɔ");                          // có dấu trọng âm
    }

    @Test
    void vowelNotBeforeR_keepsPlainForm_AC_SHADOW_13() {
        assertThat(map("ɪ", "t")).containsExactly("ɪ", "t");
        assertThat(map("ɹ", "ɪ")).containsExactly("ɹ", "ɪ");
        assertThat(map("ɛ", "d")).containsExactly("ɛ", "d");
    }

    @Test
    void unknownSymbol_isNullAndKeepsPositions_AC_SHADOW_14() {
        assertThat(map("h", "zzz", "l")).containsExactly("h", null, "l");
        assertThat(map("")).containsExactly((String) null);
    }

    @Test
    void stressMarksAreIgnored() {
        assertThat(map("ˈɪ", "ɹ")).containsExactly("ɪɹ", "ɹ");
    }
}
