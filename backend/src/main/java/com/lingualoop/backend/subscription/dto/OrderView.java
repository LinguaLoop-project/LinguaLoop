package com.lingualoop.backend.subscription.dto;

import java.time.Instant;
import java.util.UUID;

/**
 * Một đơn đăng ký của học viên (BR-PR-05): thông tin gói lưu cố định lúc tạo, trạng thái và biên nhận VNPAY.
 * {@code status}: {@code pending}, {@code paid}, {@code canceled}, {@code failed}, {@code expired}. {@code kind}:
 * {@code upgrade} hoặc {@code renew}. {@code planId} null khi gói đã bị xóa khỏi hệ thống. {@code responseCode} là mã phản hồi VNPAY, có khi đơn thất bại hoặc bị hủy trên
 * cổng.
 */
public record OrderView(UUID id, UUID planId, String planName, int months, int creditsPerMonth, int amountVnd, String kind,
        String status, Instant createdAt, Instant expiresAt, Instant paidAt, Instant startsAt, Instant endsAt,
        String transactionNo, String bankCode, Instant payDate, String responseCode) {
}
