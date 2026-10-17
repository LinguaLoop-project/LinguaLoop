package com.lingualoop.backend.devtools;

import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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

    private final JdbcClient jdbc;

    @Transactional
    public void setPro(UUID userId, boolean pro) {
        // Dù bật hay tắt đều thu hồi gói hiện có trước, để luôn còn tối đa một dòng còn hiệu lực.
        jdbc.sql("""
                UPDATE user_subscriptions SET status = 'refunded'
                WHERE user_id = :userId AND status IN ('active','cancelled')
                """)
                .param("userId", userId)
                .update();
        if (pro) {
            jdbc.sql("INSERT INTO user_subscriptions (user_id, status, price_id) VALUES (:userId, 'active', :priceId)")
                    .param("userId", userId)
                    .param("priceId", DEV_PRICE_ID)
                    .update();
        }
    }

    /** Xoá mọi bộ đếm của người dùng (không riêng ngày hôm nay) cho đơn giản và không phụ thuộc múi giờ. */
    @Transactional
    public void resetUsage(UUID userId) {
        jdbc.sql("DELETE FROM usage_counters WHERE user_id = :userId")
                .param("userId", userId)
                .update();
    }
}
