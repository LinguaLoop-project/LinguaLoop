package com.lingualoop.backend.stats.repository;

import static com.lingualoop.backend.stats.repository.StatsSql.ts;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

/**
 * Số liệu sử dụng AI và chi phí (UC-NK-04, BR-NK-09, 14, 15). Chi phí dùng thử là chi phí của học viên không có đơn
 * Pro hiệu lực tại thời điểm dùng. Đọc bảng của nhiều feature bằng câu SQL hằng, không ghi.
 */
@Repository
@RequiredArgsConstructor
public class AiUsageStatsRepository {

    /**
     * Mỗi dòng nhật ký AI trong {@code [:from, :to)} kèm cờ dùng thử: học viên không có đơn Pro đã thanh toán còn
     * hiệu lực lúc dùng (BR-NK-12, 14).
     */
    private static final String LOGS = """
            SELECT l.*, u.role = 'student' AND NOT EXISTS (
                       SELECT 1 FROM pro_orders o WHERE o.user_id = l.user_id AND o.status = 'paid'
                       AND l.created_at >= o.starts_at AND l.created_at < o.ends_at) AS trial
            FROM ai_usage_logs l JOIN users u ON u.id = l.user_id
            WHERE l.created_at >= :from AND l.created_at < :to
            """;

    private final JdbcClient jdbc;

    /**
     * Số liệu của một tính năng. Lần dùng là lần thành công, số đơn vị là tổng {@code quantity} của các lần đó (câu,
     * phiên, bài...); chi phí gồm cả lần lỗi và lượt phát sinh thêm (BR-NK-09, 15).
     */
    public record FeatureRow(String feature, long uses, long units, long credits, BigDecimal cost,
            BigDecimal trialCost) {
    }

    /** Mọi tính năng tính credit, kể cả tính năng chưa có lượt nào trong khoảng, theo thứ tự tên. */
    public List<FeatureRow> features(Instant from, Instant to) {
        return jdbc.sql("""
                SELECT f.feature,
                       count(x.id) FILTER (WHERE x.status = 'success') AS uses,
                       COALESCE(sum(x.quantity) FILTER (WHERE x.status = 'success'), 0) AS units,
                       COALESCE(sum(x.credits_charged) FILTER (WHERE x.status = 'success'), 0) AS credits,
                       COALESCE(sum(x.cost_vnd), 0) AS cost,
                       COALESCE(sum(x.cost_vnd) FILTER (WHERE x.trial), 0) AS trial_cost
                FROM ai_feature_prices f LEFT JOIN (""" + LOGS + """
                ) x ON x.feature = f.feature
                GROUP BY f.feature ORDER BY f.feature""")
                .param("from", ts(from)).param("to", ts(to))
                .query(FeatureRow.class)
                .list();
    }

    /** Credit đã tiêu theo ngày (giờ Việt Nam) của từng tính năng; ngày trống không có trong kết quả. */
    public Map<String, Map<LocalDate, Long>> dailyCredits(Instant from, Instant to) {
        Map<String, Map<LocalDate, Long>> result = new HashMap<>();
        jdbc.sql("""
                SELECT l.feature, (l.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day,
                       sum(l.credits_charged) AS n
                FROM ai_usage_logs l
                WHERE l.status = 'success' AND l.created_at >= :from AND l.created_at < :to
                GROUP BY 1, 2""")
                .param("from", ts(from)).param("to", ts(to))
                .query((rs, n) -> new DailyCredits(rs.getString("feature"), rs.getObject("day", LocalDate.class),
                        rs.getLong("n")))
                .list()
                .forEach(row -> result.computeIfAbsent(row.feature(), k -> new HashMap<>()).put(row.day(), row.n()));
        return result;
    }

    private record DailyCredits(String feature, LocalDate day, long n) {
    }

    /**
     * Tài khoản tiêu nhiều credit nhất. {@code plan} là gói tại {@code now}: {@code pro}, {@code free},
     * {@code teacher} hoặc {@code admin}.
     */
    public record TopAccountRow(UUID userId, String name, String email, String plan, long credits,
            BigDecimal cost) {
    }

    public List<TopAccountRow> topAccounts(Instant from, Instant to, Instant now, int limit) {
        return jdbc.sql("""
                SELECT l.user_id, u.display_name AS name, u.email::text AS email,
                       CASE WHEN u.role <> 'student' THEN u.role
                            WHEN EXISTS (SELECT 1 FROM pro_orders o WHERE o.user_id = u.id AND o.status = 'paid'
                                         AND o.starts_at <= :now AND o.ends_at > :now) THEN 'pro'
                            ELSE 'free' END AS plan,
                       sum(l.credits_charged) FILTER (WHERE l.status = 'success') AS credits,
                       sum(l.cost_vnd) AS cost
                FROM ai_usage_logs l JOIN users u ON u.id = l.user_id
                WHERE l.created_at >= :from AND l.created_at < :to
                GROUP BY l.user_id, u.id, u.display_name, u.email, u.role
                HAVING sum(l.credits_charged) FILTER (WHERE l.status = 'success') > 0
                ORDER BY credits DESC, cost DESC, l.user_id LIMIT :limit""")
                .param("from", ts(from)).param("to", ts(to)).param("now", ts(now)).param("limit", limit)
                .query(TopAccountRow.class)
                .list();
    }
}
