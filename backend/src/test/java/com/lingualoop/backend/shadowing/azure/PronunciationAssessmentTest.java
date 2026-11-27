package com.lingualoop.backend.shadowing.azure;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;

/** BR-SH-23, AC-SH-29: điểm tổng do hệ thống tính từ các điểm thành phần. */
class PronunciationAssessmentTest {

    private static PronunciationAssessment of(double accuracy, double fluency, double completeness, Double prosody) {
        return new PronunciationAssessment("x", 12.3, accuracy, fluency, completeness, prosody, List.of());
    }

    @Test
    void weightsAccuracyFluencyAndProsody_notTheAzureOverall_AC_SH_29() {
        // 0,5×95 + 0,3×94 + 0,2×71 = 89,9; Azure báo 86 cho cùng lượt đọc
        assertThat(PronunciationAssessment.overall(95, 94, 100, 71.0)).isEqualTo(89.9);
        assertThat(of(95, 94, 100, 71.0).overallScore()).isEqualTo(89.9);
    }

    @Test
    void readingOnlyPartOfTheSentenceScalesTheScoreDown_AC_SH_29() {
        // cơ sở 98, đọc đủ một nửa thì còn 49
        assertThat(PronunciationAssessment.overall(100, 100, 50, 90.0)).isEqualTo(49.0);
    }

    @Test
    void withoutProsodyTheWeightsAreRedistributed_AC_SH_29() {
        assertThat(PronunciationAssessment.overall(80, 60, 100, null)).isEqualTo(72.0);
    }

    @Test
    void staysWithinZeroAndOneHundred_AC_SH_29() {
        assertThat(PronunciationAssessment.overall(100, 100, 100, 100.0)).isEqualTo(100.0);
        assertThat(PronunciationAssessment.overall(0, 0, 0, 0.0)).isEqualTo(0.0);
        assertThat(PronunciationAssessment.overall(120, 120, 130, 120.0)).isEqualTo(100.0);
    }
}
