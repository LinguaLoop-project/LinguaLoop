package com.lingualoop.backend.tutor;

import java.util.List;

/** Điểm của một Lượt chấm từ (BR-TUTOR-01, BR-TUTOR-04). */
public final class WordScoring {

    private WordScoring() {
    }

    /**
     * Điểm của một Lượt chấm từ: điểm âm đích trọng tâm của từ nếu từ có, ngược lại điểm cả lượt. Nếu Azure không
     * trả về từ đó thì tìm âm ở mọi từ; không thấy âm thì coi như 0 điểm. Khi Azure báo một phụ âm khác âm đích thì
     * điểm tối đa là dưới ngưỡng lỗi (không đạt), vì Azure có thể chấm cao cho một cách đọc lệch chuẩn.
     */
    public static double scoreOf(SentenceResult assessment, PracticeWord word) {
        if (word.phoneme() == null) {
            return assessment.accuracy();
        }
        String target = word.key();
        List<SentenceResult.Word> matching = assessment.words().stream()
                .filter(w -> !w.inserted() && Words.normalize(w.text()).equals(target))
                .toList();
        return (matching.isEmpty() ? assessment.words() : matching).stream()
                .flatMap(w -> w.phonemes().stream())
                .filter(p -> word.phoneme().equals(p.symbol()))
                .mapToDouble(p -> p.mismatch() ? Math.min(p.accuracy(), TutorThresholds.PHONEME_ERROR_SCORE - 1) : p.accuracy())
                .min()
                .orElse(0);
    }
}
