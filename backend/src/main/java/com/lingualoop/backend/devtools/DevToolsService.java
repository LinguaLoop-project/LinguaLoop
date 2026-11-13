package com.lingualoop.backend.devtools;

import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.subscription.entity.ProOrder;
import com.lingualoop.backend.subscription.repository.ProOrderRepository;

import lombok.RequiredArgsConstructor;

/**
 * Công cụ chỉ để thử tính năng Free/Pro và credit khi chưa có thanh toán thật. Bật Pro = tạo một đơn
 * {@code pro_orders} đã thanh toán, nên {@code isPro} và ví credit chạy đúng đường thật. Chỉ nạp khi
 * {@code app.dev-tools.enabled=true}; bỏ cả package này khi làm thanh toán Pro thật.
 */
@Service
@ConditionalOnProperty(name = "app.dev-tools.enabled", havingValue = "true")
@RequiredArgsConstructor
class DevToolsService {

    private static final String DEV_PLAN_NAME = "Dev";
    private static final int DEV_CREDITS_PER_MONTH = 1000;

    private final ProOrderRepository orders;
    private final JdbcClient jdbc;
    private final Clock clock;

    /** Dù bật hay tắt đều kết thúc đơn đang hiệu lực trước, để luôn còn tối đa một đơn còn hiệu lực. */
    @Transactional
    public void setPro(UUID userId, boolean pro) {
        Instant now = clock.instant();
        orders.endActive(userId, now);
        if (pro) {
            Instant endsAt = now.atZone(ZoneOffset.UTC).plusMonths(1).toInstant();
            orders.save(ProOrder.paidNow(userId, DEV_PLAN_NAME, 1, DEV_CREDITS_PER_MONTH, 0, now, endsAt));
        }
    }

    /** Đặt số dư ví credit (tạo ví nếu chưa có); mốc đặt lại giữ nguyên. */
    @Transactional
    public void setCredits(UUID userId, int balance) {
        jdbc.sql("""
                INSERT INTO ai_wallets (user_id, balance, resets_at, updated_at) VALUES (:u, :b, NULL, :now)
                ON CONFLICT (user_id) DO UPDATE SET balance = :b, updated_at = :now""")
                .param("u", userId).param("b", balance).param("now", java.sql.Timestamp.from(clock.instant()))
                .update();
    }
}
