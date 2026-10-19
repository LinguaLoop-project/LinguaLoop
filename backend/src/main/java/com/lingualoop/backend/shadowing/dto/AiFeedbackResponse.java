package com.lingualoop.backend.shadowing.dto;

import java.time.Instant;

import com.lingualoop.backend.subscription.dto.FeatureUsage;

/**
 * Nhận xét AI của một lượt. {@code cached} là true khi lượt đã có nhận xét từ trước: trả lại bản đã lưu và không trừ
 * thêm lượt.
 */
public record AiFeedbackResponse(long attemptId, String content, Instant createdAt, boolean cached,
        FeatureUsage usage) {
}
