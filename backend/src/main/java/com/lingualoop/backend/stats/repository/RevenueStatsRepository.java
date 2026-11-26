package com.lingualoop.backend.stats.repository;

import static com.lingualoop.backend.stats.repository.StatsSql.ts;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

/** Đơn Pro đã thanh toán và thông số quy đổi cho phần doanh thu (BR-NK-06). Chỉ đọc. */
@Repository
@RequiredArgsConstructor
public class RevenueStatsRepository {

    private final JdbcClient jdbc;

    /** Một đơn Pro đã thanh toán. */
    public record PaidOrder(long amountVnd, Instant startsAt, Instant endsAt) {
    }

    /** Giá trị 1 credit (đồng) và phí cổng thanh toán hiện hành (%) (BR-GA-02). */
    public record Settings(int creditValueVnd, BigDecimal gatewayFeePct) {
    }

    /** Đơn có thời gian hiệu lực giao với {@code [from, to)}. */
    public List<PaidOrder> paidOrders(Instant from, Instant to) {
        return jdbc.sql("""
                SELECT amount_vnd, starts_at, ends_at FROM pro_orders
                WHERE status = 'paid' AND starts_at < :to AND ends_at > :from""")
                .param("from", ts(from)).param("to", ts(to))
                .query((rs, n) -> new PaidOrder(rs.getLong("amount_vnd"), rs.getTimestamp("starts_at").toInstant(),
                        rs.getTimestamp("ends_at").toInstant()))
                .list();
    }

    public Settings settings() {
        return jdbc.sql("SELECT credit_value_vnd, gateway_fee_pct FROM ai_settings WHERE id = 1")
                .query((rs, n) -> new Settings(rs.getInt("credit_value_vnd"), rs.getBigDecimal("gateway_fee_pct")))
                .single();
    }
}
