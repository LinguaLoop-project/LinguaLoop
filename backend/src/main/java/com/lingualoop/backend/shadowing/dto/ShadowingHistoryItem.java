package com.lingualoop.backend.shadowing.dto;

import java.time.Instant;

/** Một lượt đọc trong lịch sử của câu: điểm tổng và bốn điểm thành phần (null nếu Azure không trả). */
public record ShadowingHistoryItem(long attemptId, double score, Double accuracy, Double fluency,
        Double completeness, Double prosody, Instant attemptedAt) {
}
