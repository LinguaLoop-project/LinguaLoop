package com.lingualoop.backend.ai;

/** Nhận xét AI đã viết, kèm thông tin để kiểm soát chất lượng và chi phí (lưu vào {@code ai_feedback}). */
public record GeneratedFeedback(String content, String model, String promptVersion, Integer inputTokens,
        Integer outputTokens) {
}
