package com.lingualoop.backend.shadowing.dto;

import java.util.List;
import java.util.UUID;

/**
 * Kết quả đã lưu của một Lượt shadowing, dạng gọn cho module khác (Phiên gia sư) đọc: từng từ và từng âm theo âm đích
 * (ADR 0005), kèm quy tắc "cần sửa". Không có mẹo và video.
 */
public record AttemptSnapshot(long attemptId, UUID lessonId, UUID sentenceId, String sentenceText,
        String sentenceIpa, double accuracy, List<Word> words) {

    /** {@code outcome}: correct, mispronounced, omitted hoặc inserted. */
    public record Word(String text, double accuracy, String outcome, List<Phoneme> phonemes) {
    }

    /**
     * @param symbol   âm đích; là cách đọc Azure báo khi không ghép được âm đích
     * @param needsFix điểm dưới 60, hoặc phụ âm khác âm đích
     * @param mismatch Azure báo một phụ âm khác âm đích (vd cần f nhưng báo v)
     */
    public record Phoneme(String symbol, double accuracy, boolean needsFix, boolean mismatch) {
    }
}
