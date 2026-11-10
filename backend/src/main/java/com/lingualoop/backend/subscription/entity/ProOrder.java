package com.lingualoop.backend.subscription.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Một đơn mua hoặc gia hạn gói Pro. Sao chép giá, thời hạn, credit lúc mua. "Học viên Pro" là người có đơn
 * {@code paid} với {@code starts_at <= now < ends_at}.
 */
@Getter
@Entity
@Table(name = "pro_orders")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ProOrder {

    public static final String PAID = "paid";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "plan_name", nullable = false, updatable = false)
    private String planName;

    @Column(name = "months", nullable = false, updatable = false)
    private short months;

    @Column(name = "credits_per_month", nullable = false, updatable = false)
    private int creditsPerMonth;

    @Column(name = "amount_vnd", nullable = false, updatable = false)
    private int amountVnd;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "expires_at", nullable = false, updatable = false)
    private Instant expiresAt;

    @Column(name = "paid_at")
    private Instant paidAt;

    @Column(name = "starts_at")
    private Instant startsAt;

    @Column(name = "ends_at")
    private Instant endsAt;

    /** Đơn đã thanh toán, bắt đầu ngay {@code now} và hết hạn lúc {@code endsAt}. */
    public static ProOrder paidNow(UUID userId, String planName, int months, int creditsPerMonth, int amountVnd,
            Instant now, Instant endsAt) {
        ProOrder order = new ProOrder();
        order.userId = userId;
        order.planName = planName;
        order.months = (short) months;
        order.creditsPerMonth = creditsPerMonth;
        order.amountVnd = amountVnd;
        order.status = PAID;
        order.expiresAt = now;
        order.paidAt = now;
        order.startsAt = now;
        order.endsAt = endsAt;
        return order;
    }
}
