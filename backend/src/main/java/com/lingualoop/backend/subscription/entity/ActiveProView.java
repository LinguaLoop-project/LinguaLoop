package com.lingualoop.backend.subscription.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Immutable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** View {@code v_active_pro}: người dùng có đơn Pro đã thanh toán còn hiệu lực (không lưu cứng). */
@Getter
@Entity
@Immutable
@Table(name = "v_active_pro")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ActiveProView {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Column(name = "ends_at")
    private Instant endsAt;
}
