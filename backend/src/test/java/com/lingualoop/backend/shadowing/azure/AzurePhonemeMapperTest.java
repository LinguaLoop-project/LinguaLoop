package com.lingualoop.backend.shadowing.azure;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import java.util.List;
import java.util.Set;

import org.junit.jupiter.api.Test;

class AzurePhonemeMapperTest {

    /** 44 âm của bảng {@code phonemes} (V2__seed_reference_data.sql). */
    private static final Set<String> TABLE = Set.of(
            "p", "b", "t", "d", "k", "g", "f", "v", "θ", "ð", "s", "z", "ʃ", "ʒ", "h", "tʃ", "dʒ",
            "m", "n", "ŋ", "l", "r", "j", "w",
            "iː", "ɪ", "e", "æ", "ʌ", "ɑː", "ɒ", "ɔː", "ʊ", "uː", "ɜː", "ə",
            "eɪ", "aɪ", "ɔɪ", "aʊ", "əʊ", "ɪə", "eə", "ʊə");

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
    void singleSymbolRules() {
        assertThat(map("oʊ")).containsExactly("əʊ");
        assertThat(map("ɝ")).containsExactly("ɜː");
        assertThat(map("ɚ")).containsExactly("ə");
        assertThat(map("ɹ")).containsExactly("r");
        assertThat(map("ɡ")).containsExactly("g");
        assertThat(map("i")).containsExactly("iː");
        assertThat(map("u")).containsExactly("uː");
        assertThat(map("ɛ")).containsExactly("e");
        assertThat(map("ɑ")).containsExactly("ɑː");
        assertThat(map("ɔ")).containsExactly("ɔː");
    }

    @Test
    void vowelBeforeR_becomesDiphthongAndKeepsR_AC_SHADOW_13() {
        assertThat(map("n", "ɪ", "ɹ")).containsExactly("n", "ɪə", "r");      // near
        assertThat(map("s", "k", "w", "ɛ", "ɹ")).containsExactly("s", "k", "w", "eə", "r"); // square
        assertThat(map("k", "j", "ʊ", "ɹ")).containsExactly("k", "j", "ʊə", "r");           // cure
    }

    @Test
    void rColouredVowelAsOneSymbol_mapsToVowelWithoutExtraR_AC_SHADOW_13() {
        assertThat(map("m", "ɔɹ", "n")).containsExactly("m", "ɔː", "n");     // morning (đo từ Azure thật)
        assertThat(map("ɑɹ")).containsExactly("ɑː");                          // car
        assertThat(map("n", "ɪɹ")).containsExactly("n", "ɪə");                // near
        assertThat(map("w", "ɛɹ")).containsExactly("w", "eə");                // where
        assertThat(map("p", "ʊɹ")).containsExactly("p", "ʊə");                // pure
        assertThat(map("ˈɔɹ")).containsExactly("ɔː");                          // có dấu trọng âm
    }

    @Test
    void vowelNotBeforeR_keepsPlainForm_AC_SHADOW_13() {
        assertThat(map("ɪ", "t")).containsExactly("ɪ", "t");
        assertThat(map("ɹ", "ɪ")).containsExactly("r", "ɪ");
        assertThat(map("ɛ", "d")).containsExactly("e", "d");
    }

    @Test
    void unknownSymbol_isNullAndKeepsPositions_AC_SHADOW_14() {
        assertThat(map("h", "zzz", "l")).containsExactly("h", null, "l");
        assertThat(map("")).containsExactly((String) null);
    }

    @Test
    void stressMarksAreIgnored() {
        assertThat(map("ˈɪ", "ɹ")).containsExactly("ɪə", "r");
    }
}
