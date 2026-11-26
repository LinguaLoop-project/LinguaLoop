package com.lingualoop.backend.audit.enums;

import java.time.Duration;
import java.time.Instant;
import java.util.Optional;

/** Khoảng thời gian của danh sách nhật ký: 7, 30, 90 ngày gần nhất hoặc Tất cả; mặc định 7 ngày (BR-NK-04). */
public enum AuditPeriod {
    D7(7),
    D30(30),
    D90(90),
    ALL(0);

    private final int days;

    AuditPeriod(int days) {
        this.days = days;
    }

    /** Mốc bắt đầu tính từ {@code now}; Tất cả thì không có mốc. */
    public Optional<Instant> since(Instant now) {
        return days == 0 ? Optional.empty() : Optional.of(now.minus(Duration.ofDays(days)));
    }
}
