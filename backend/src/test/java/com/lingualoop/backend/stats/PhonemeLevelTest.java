package com.lingualoop.backend.stats;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

/** Ngưỡng mức hiển thị của một âm vị (BR-TH-09, BR-TH-11). */
class PhonemeLevelTest {

    @Test
    void fewerThanFiveEncounters_isInsufficientNoMatterTheErrors_AC_TH_14() {
        assertThat(PhonemeLevel.of(0, 0)).isEqualTo(PhonemeLevel.INSUFFICIENT);
        assertThat(PhonemeLevel.of(3, 3)).isEqualTo(PhonemeLevel.INSUFFICIENT);
        assertThat(PhonemeLevel.of(4, 4)).isEqualTo(PhonemeLevel.INSUFFICIENT);
    }

    @Test
    void exactlyFiveEncounters_areEnoughToRate_AC_TH_17() {
        assertThat(PhonemeLevel.of(5, 0)).isEqualTo(PhonemeLevel.GOOD);
        assertThat(PhonemeLevel.of(5, 5)).isEqualTo(PhonemeLevel.BAD);
    }

    @Test
    void below15Percent_isGood_andExactly15IsAttention_AC_TH_14() {
        assertThat(PhonemeLevel.of(10, 1)).isEqualTo(PhonemeLevel.GOOD);        // 10%
        assertThat(PhonemeLevel.of(20, 2)).isEqualTo(PhonemeLevel.GOOD);        // 10%
        assertThat(PhonemeLevel.of(100, 14)).isEqualTo(PhonemeLevel.GOOD);      // 14%
        assertThat(PhonemeLevel.of(20, 3)).isEqualTo(PhonemeLevel.ATTENTION);   // đúng 15%
    }

    @Test
    void between15And30Percent_isAttention_andAbove30IsBad_AC_TH_14() {
        assertThat(PhonemeLevel.of(10, 2)).isEqualTo(PhonemeLevel.ATTENTION);   // 20%
        assertThat(PhonemeLevel.of(10, 3)).isEqualTo(PhonemeLevel.ATTENTION);   // đúng 30%
        assertThat(PhonemeLevel.of(10, 4)).isEqualTo(PhonemeLevel.BAD);         // 40%
        assertThat(PhonemeLevel.of(100, 31)).isEqualTo(PhonemeLevel.BAD);
    }

    @Test
    void percentRoundsAndIsNullWhenNeverEncountered_AC_TH_15() {
        assertThat(PhonemeLevel.percent(10, 4)).isEqualTo(40);
        assertThat(PhonemeLevel.percent(3, 1)).isEqualTo(33);
        assertThat(PhonemeLevel.percent(0, 0)).isNull();
    }
}
