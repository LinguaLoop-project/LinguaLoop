package com.lingualoop.backend.credit.dto;

import java.time.Instant;

/**
 * Số dư credit AI. {@code resetsAt} null khi ví không đặt lại (giáo viên, quản trị viên).
 * {@code kind}: {@code free}, {@code pro} hoặc {@code staff}.
 */
public record CreditBalance(int balance, Instant resetsAt, String kind) {
}
