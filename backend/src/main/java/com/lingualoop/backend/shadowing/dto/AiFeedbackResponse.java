package com.lingualoop.backend.shadowing.dto;

import java.time.Instant;

import com.lingualoop.backend.credit.dto.CreditBalance;

/**
 * Nhận xét AI của một lượt. {@code cached} là true khi lượt đã có nhận xét từ trước: trả lại bản đã lưu và không trừ
 * thêm credit. {@code credit} là số dư sau khi trừ.
 */
public record AiFeedbackResponse(long attemptId, String content, Instant createdAt, boolean cached,
        CreditBalance credit) {
}
