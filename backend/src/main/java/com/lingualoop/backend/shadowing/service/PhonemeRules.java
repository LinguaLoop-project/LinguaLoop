package com.lingualoop.backend.shadowing.service;

import com.lingualoop.backend.shadowing.azure.ExpectedPhonemes;

/**
 * Khi nào một âm của người học được coi là cần sửa. Một nguồn duy nhất cho giao diện, nhận xét AI và thống kê.
 */
final class PhonemeRules {

    /** Âm dưới ngưỡng này được coi là đọc sai (cùng ngưỡng với giao diện). */
    static final double WEAK_BELOW = 60;

    private PhonemeRules() {
    }

    /**
     * Điểm thấp, hoặc Azure báo một phụ âm khác âm mẫu (vd cần /f/ nhưng báo /v/) dù vẫn chấm cao: Azure coi cách đọc
     * lệch đó là chấp nhận được nên cho điểm cao, nhưng người học vẫn cần sửa. Chỉ xét phụ âm; nguyên âm lệch nhau
     * thường là rút gọn bình thường trong lời nói (ɪ/ə) nên không bị đánh dấu.
     */
    static boolean needsFix(double accuracy, String heard, String expected) {
        if (accuracy < WEAK_BELOW) {
            return true;
        }
        return mismatch(heard, expected);
    }

    /** Azure báo một phụ âm khác âm đích (vd cần /f/ nhưng báo /v/). */
    static boolean mismatch(String heard, String expected) {
        return expected != null && !expected.equals(heard)
                && ExpectedPhonemes.isConsonant(heard) && ExpectedPhonemes.isConsonant(expected);
    }
}
