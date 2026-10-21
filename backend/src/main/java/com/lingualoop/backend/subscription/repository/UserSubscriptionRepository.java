package com.lingualoop.backend.subscription.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.subscription.entity.UserSubscription;

public interface UserSubscriptionRepository extends JpaRepository<UserSubscription, UUID> {

    /** Thu hồi mọi gói còn hiệu lực của người dùng. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("UPDATE UserSubscription s SET s.status = 'refunded' WHERE s.userId = :userId AND s.status IN ('active', 'cancelled')")
    int revokeCurrent(@Param("userId") UUID userId);
}
