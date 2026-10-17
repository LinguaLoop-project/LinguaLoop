package com.lingualoop.backend.subscription.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.subscription.dto.FeatureUsage;
import com.lingualoop.backend.subscription.dto.UsageTicket;

/** Hạn mức theo gói và tính năng (bảng {@code plan_limits}, bộ đếm {@code usage_counters}). */
public interface UsageService {

    /**
     * Giữ chỗ một lượt bằng phép tăng nguyên tử có điều kiện, nên các yêu cầu đồng thời không vượt hạn mức.
     *
     * @throws com.lingualoop.backend.common.exception.BusinessException {@code QUOTA_EXCEEDED} khi hết lượt
     */
    UsageTicket tryConsume(UUID userId, String feature);

    /** Trả lại lượt đã giữ chỗ (không xuống dưới 0). */
    void refund(UUID userId, UsageTicket ticket);

    /** Mức dùng của mọi tính năng có hạn mức theo gói hiện tại. */
    List<FeatureUsage> usageOf(UUID userId);

    /** Mức dùng của một tính năng. */
    FeatureUsage usageOf(UUID userId, String feature);
}
