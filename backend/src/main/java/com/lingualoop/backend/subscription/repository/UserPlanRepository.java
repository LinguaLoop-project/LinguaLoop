package com.lingualoop.backend.subscription.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.repository.Repository;

import com.lingualoop.backend.subscription.entity.UserPlanView;

/** Đọc view {@code v_user_plan} (gói suy ra từ user_subscriptions còn hạn). */
public interface UserPlanRepository extends Repository<UserPlanView, UUID> {

    Optional<UserPlanView> findByUserId(UUID userId);

    default boolean isPro(UUID userId) {
        return findByUserId(userId).map(v -> "pro".equals(v.getPlan())).orElse(false);
    }
}
