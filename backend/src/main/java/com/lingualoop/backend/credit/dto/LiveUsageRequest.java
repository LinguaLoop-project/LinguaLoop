package com.lingualoop.backend.credit.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.PositiveOrZero;

/**
 * Tổng số đơn vị xử lý mà dịch vụ AI báo cho trình duyệt trong một phiên giọng nói (cộng mọi lần báo), gửi khi phiên
 * đóng để ghi chi phí (BR-GA-12). Chỉ dùng cho thống kê, không ảnh hưởng credit.
 */
public record LiveUsageRequest(
        @PositiveOrZero @Max(1_000_000_000L) long inputTokens,
        @PositiveOrZero @Max(1_000_000_000L) long outputTokens) {
}
