package com.lingualoop.backend.subscription.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Một gói Pro trên màn hình quản trị (UC-GA-03). {@code purchases} là số đơn đã thanh toán; {@code version} gửi lại khi
 * sửa để phát hiện người khác vừa sửa (UC-GA-05 7a).
 */
public record ProPlanView(UUID id, String name, int months, int priceVnd, int creditsPerMonth, boolean onSale,
        long purchases, Instant version) {
}
