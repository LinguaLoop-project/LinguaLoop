package com.lingualoop.backend.subscription.repository;

import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

/** Đọc view {@code v_user_plan} (gói suy ra từ user_subscriptions còn hạn). */
@Repository
@RequiredArgsConstructor
public class UserPlanRepository {

    private final JdbcClient jdbc;

    public boolean isPro(UUID userId) {
        return jdbc.sql("SELECT plan FROM v_user_plan WHERE user_id = :userId")
                .param("userId", userId)
                .query(String.class)
                .optional()
                .map("pro"::equals)
                .orElse(false);
    }
}
