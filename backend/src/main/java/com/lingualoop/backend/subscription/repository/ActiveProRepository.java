package com.lingualoop.backend.subscription.repository;

import java.util.UUID;

import org.springframework.data.repository.Repository;

import com.lingualoop.backend.subscription.entity.ActiveProView;

/** Đọc view {@code v_active_pro} (đơn Pro đã thanh toán còn hạn). */
public interface ActiveProRepository extends Repository<ActiveProView, UUID> {

    boolean existsByUserId(UUID userId);
}
