package com.lingualoop.backend.subscription.service;

import java.util.UUID;

/**
 * Hợp đồng của feature subscription cho các feature khác (planning/README.md §4).
 * TODO(contract): bổ sung hạn dùng và chi tiết gói khi Lâm làm xong màn Cài đặt, tab Gói.
 */
public interface SubscriptionQueryService {

    /** Người dùng có đang ở gói Pro (còn hạn, chưa hoàn tiền) hay không. */
    boolean isPro(UUID userId);
}
