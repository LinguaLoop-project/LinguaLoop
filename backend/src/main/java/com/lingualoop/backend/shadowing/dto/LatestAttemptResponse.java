package com.lingualoop.backend.shadowing.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Lượt shadowing mới nhất của một câu, kèm điểm cao nhất và số lần đọc. Chỉ có điểm từng từ (không có âm vị),
 * vì âm vị lưu theo bảng {@code phonemes} chứ không theo ký hiệu Azure.
 */
public record LatestAttemptResponse(
        UUID sentenceId,
        long attemptId,
        double score,
        Instant attemptedAt,
        double bestScore,
        int attemptCount,
        List<WordSummary> words) {

    public record WordSummary(int position, String word, double accuracy, String outcome) {
    }
}
