package com.lingualoop.backend.subscription.entity;

import java.util.UUID;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** View {@code v_user_plan}: gói suy ra từ {@code user_subscriptions} còn hạn (không lưu cứng). */
@Getter
@Entity
@Immutable
@Table(name = "v_user_plan")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UserPlanView {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "plan")
    private String plan;
}
