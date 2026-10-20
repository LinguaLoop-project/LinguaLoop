package com.lingualoop.backend.shadowing.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PhonemeRulesTest {

    @Test
    void lowScoreAlwaysNeedsFix() {
        assertThat(PhonemeRules.needsFix(59.9, "f", "f")).isTrue();
        assertThat(PhonemeRules.needsFix(59.9, "f", null)).isTrue();
    }

    @Test
    void highScoreButDifferentConsonant_needsFix_becauseAzureAcceptsVariantsThatLearnersStillMustFix() {
        // "if" đọc thành "iv": Azure vẫn chấm 100 cho /v/
        assertThat(PhonemeRules.needsFix(100, "v", "f")).isTrue();
    }

    @Test
    void highScoreWithSameOrUnknownTarget_isFine() {
        assertThat(PhonemeRules.needsFix(100, "f", "f")).isFalse();
        assertThat(PhonemeRules.needsFix(100, "v", null)).isFalse();
    }

    @Test
    void differentVowels_areNotFlagged_becauseReducedVowelsAreNormalInSpeech() {
        assertThat(PhonemeRules.needsFix(95, "ə", "ɪ")).isFalse();
    }
}
