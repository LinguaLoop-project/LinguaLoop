package com.lingualoop.backend.credit.dto;

import java.time.Instant;

/**
 * Số dư credit AI. {@code resetsAt} là mốc làm mới credit tháng của gói Pro; null khi ví không đặt lại (credit dùng thử của gói Free, giáo viên, quản trị viên).
 * {@code kind}: {@code free}, {@code pro} hoặc {@code staff}.
 */
public record CreditBalance(int balance, Instant resetsAt, String kind) {
}
