package com.lingualoop.backend.devtools;

import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.subscription.entity.UserSubscription;
import com.lingualoop.backend.subscription.repository.UsageCounterRepository;
import com.lingualoop.backend.subscription.repository.UserSubscriptionRepository;

import lombok.RequiredArgsConstructor;

/**
 * Công cụ chỉ để thử tính năng Free/Pro khi chưa có đăng ký thật. Ghi thẳng vào
 * {@code user_subscriptions} và {@code usage_counters} nên {@code v_user_plan} và mọi
 * chỗ kiểm tra gói giữ nguyên. Chỉ nạp khi {@code app.dev-tools.enabled=true}; bỏ cả
 * package này khi làm đăng ký Pro thật.
 */
@Service
@ConditionalOnProperty(name = "app.dev-tools.enabled", havingValue = "true")
@RequiredArgsConstructor
class DevToolsService {

    private static final String DEV_PRICE_ID = "dev-toggle";

    private final UserSubscriptionRepository subscriptions;
    private final UsageCounterRepository counters;

    @Transactional
    public void setPro(UUID userId, boolean pro) {
        // Dù bật hay tắt đều thu hồi gói hiện có trước, để luôn còn tối đa một dòng còn hiệu lực.
        subscriptions.revokeCurrent(userId);
        if (pro) {
            subscriptions.save(UserSubscription.active(userId, DEV_PRICE_ID));
        }
    }

    /** Xoá mọi bộ đếm của người dùng (không riêng ngày hôm nay) cho đơn giản và không phụ thuộc múi giờ. */
    @Transactional
    public void resetUsage(UUID userId) {
        counters.deleteAllOf(userId);
    }
}
