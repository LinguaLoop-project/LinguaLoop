package com.lingualoop.backend.tutor;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

/**
 * Kết quả chấm của một câu (hoặc một từ), dạng đầu vào cho luật của Phiên gia sư. Độc lập với DB và với Azure: lớp
 * dịch vụ dựng nó từ kết quả đã lưu (xem ADR 0005).
 *
 * @param accuracy điểm chính xác của cả lượt chấm; dùng làm điểm khi từ luyện không có âm vị nào
 */
public record SentenceResult(double accuracy, List<Word> words) {

    public SentenceResult {
        words = words == null ? List.of() : List.copyOf(words);
    }

    /**
     * @param outcome correct, mispronounced, omitted hoặc inserted; từ thừa không có trong câu mẫu nên không bao giờ
     *                được luyện
     */
    public record Word(String text, double accuracy, String outcome, List<Phoneme> phonemes) {

        public Word {
            phonemes = phonemes == null ? List.of() : List.copyOf(phonemes);
        }

        public boolean inserted() {
            return "inserted".equals(outcome);
        }
    }

    /**
     * @param symbol   âm đích theo bảng phonemes; là âm Azure báo khi không ghép được âm đích
     * @param needsFix điểm dưới 60, hoặc phụ âm khác âm đích dù điểm cao (quy tắc `PhonemeRules`, ADR 0005)
     * @param mismatch Azure báo một phụ âm khác âm đích (vd cần f nhưng báo v): lỗi rõ hơn điểm thấp thông thường
     */
    public record Phoneme(String symbol, double accuracy, boolean needsFix, boolean mismatch) {
    }

    /** Các âm đích cần sửa (không trùng) trong kết quả, bỏ qua từ thừa. */
    public Set<String> errorSymbols() {
        Set<String> errors = new LinkedHashSet<>();
        for (Word word : words) {
            if (word.inserted()) {
                continue;
            }
            for (Phoneme phoneme : word.phonemes()) {
                if (phoneme.needsFix()) {
                    errors.add(phoneme.symbol());
                }
            }
        }
        return errors;
    }
}
