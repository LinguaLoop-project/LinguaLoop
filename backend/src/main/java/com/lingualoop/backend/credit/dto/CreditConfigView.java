package com.lingualoop.backend.credit.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Cấu hình credit cho màn hình quản trị (UC-GA-01). {@code updatedBy} null nghĩa là chưa từng được sửa (5a).
 * {@code version} gửi lại khi lưu để phát hiện người khác vừa sửa (UC-GA-02 8b).
 */
public record CreditConfigView(
        int creditValueVnd,
        BigDecimal gatewayFeePct,
        BigDecimal marginPct,
        int trialCredits,
        List<FeatureRow> features,
        Editor updatedBy,
        Instant updatedAt,
        Instant version) {

    /** Một hàng của bảng dịch vụ tính credit (BR-GA-04). {@code feature} là mã tính năng, vd {@code lesson_chat}. */
    public record FeatureRow(String feature, int creditsPerUse, long inputPriceVnd, long outputPriceVnd,
            int fixedCostVnd) {
    }

    /** Quản trị viên sửa gần nhất (BR-GA-09). */
    public record Editor(UUID id, String displayName) {
    }
}
