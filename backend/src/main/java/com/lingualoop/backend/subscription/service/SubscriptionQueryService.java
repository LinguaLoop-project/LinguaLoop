package com.lingualoop.backend.subscription.service;

import java.util.Optional;
import java.util.UUID;

import com.lingualoop.backend.subscription.dto.ActiveProOrder;

/** Hợp đồng của feature subscription cho các feature khác (planning/README.md §4). */
public interface SubscriptionQueryService {

    /** Người dùng có đang ở gói Pro (có đơn paid còn hạn) hay không. */
    boolean isPro(UUID userId);

    /** Đơn Pro đang hiệu lực; rỗng với học viên Free. */
    Optional<ActiveProOrder> activeOrder(UUID userId);
}
