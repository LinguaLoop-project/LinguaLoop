package com.lingualoop.backend.subscription.entity;

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

/** Một đợt đăng ký gói Pro. Ngày kích hoạt và ngày tạo lấy mặc định {@code now()} của DB. */
@Getter
@Entity
@Table(name = "user_subscriptions")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserSubscription {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "price_id", updatable = false)
    private String priceId;

    public static UserSubscription active(UUID userId, String priceId) {
        UserSubscription subscription = new UserSubscription();
        subscription.userId = userId;
        subscription.status = "active";
        subscription.priceId = priceId;
        return subscription;
    }
}
