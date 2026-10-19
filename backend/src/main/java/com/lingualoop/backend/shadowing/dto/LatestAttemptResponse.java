package com.lingualoop.backend.shadowing.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Lượt shadowing mới nhất của một câu, kèm điểm cao nhất và số lần đọc. Có đủ điểm thành phần, từng từ với từng âm vị
 * (kèm mẹo sửa và video khẩu hình như lúc vừa chấm) và nhận xét AI đã lưu, để mở lại bài thấy đầy đủ như lúc vừa chấm xong.
 */
public record LatestAttemptResponse(
        UUID sentenceId,
        long attemptId,
        double score,
        Double accuracy,
        Double fluency,
        Double completeness,
        Double prosody,
        Instant attemptedAt,
        double bestScore,
        int attemptCount,
        List<ShadowingAttemptResponse.WordResult> words,
        SavedAiFeedback aiFeedback) {

    /** Nhận xét AI đã lưu của lượt, null nếu lượt chưa có. */
    public record SavedAiFeedback(String content, Instant createdAt) {
    }
}
