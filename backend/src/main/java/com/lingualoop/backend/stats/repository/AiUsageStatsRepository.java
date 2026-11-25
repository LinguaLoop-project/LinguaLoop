package com.lingualoop.backend.stats.repository;

import static com.lingualoop.backend.stats.repository.StatsSql.inRange;
import static com.lingualoop.backend.stats.repository.StatsSql.proAt;
import static com.lingualoop.backend.stats.repository.StatsSql.ts;
import static com.lingualoop.backend.stats.repository.StatsSql.vnDay;

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

    /** Mỗi dòng nhật ký AI trong khoảng kèm cờ dùng thử: học viên không đang Pro lúc dùng (BR-NK-14). */
    private static final String LOGS = """
            SELECT l.*, u.role = 'student' AND NOT %s AS trial
            FROM ai_usage_logs l JOIN users u ON u.id = l.user_id
            WHERE %s
            """.formatted(proAt("l"), inRange("l"));

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
                .query((rs, n) -> new FeatureRow(rs.getString("feature"), rs.getLong("uses"), rs.getLong("units"),
                        rs.getLong("credits"), rs.getBigDecimal("cost"), rs.getBigDecimal("trial_cost")))
                .list();
    }

    /** Credit đã tiêu theo ngày (giờ Việt Nam) của từng tính năng; ngày trống không có trong kết quả. */
    public Map<String, Map<LocalDate, Long>> dailyCredits(Instant from, Instant to) {
        Map<String, Map<LocalDate, Long>> result = new HashMap<>();
        jdbc.sql("SELECT l.feature, " + vnDay("l.created_at") + " AS day, sum(l.credits_charged) AS n "
                + "FROM ai_usage_logs l WHERE l.status = 'success' AND " + inRange("l") + " GROUP BY 1, 2")
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
                SELECT l.user_id, u.display_name, u.email::text AS email,
                       CASE WHEN u.role <> 'student' THEN u.role
                            WHEN EXISTS (SELECT 1 FROM pro_orders o WHERE o.user_id = u.id AND o.status = 'paid'
                                         AND o.starts_at <= :now AND o.ends_at > :now) THEN 'pro'
                            ELSE 'free' END AS plan,
                       sum(l.credits_charged) FILTER (WHERE l.status = 'success') AS credits,
                       sum(l.cost_vnd) AS cost
                FROM ai_usage_logs l JOIN users u ON u.id = l.user_id
                WHERE """ + " " + inRange("l") + """

                GROUP BY l.user_id, u.id, u.display_name, u.email, u.role
                HAVING sum(l.credits_charged) FILTER (WHERE l.status = 'success') > 0
                ORDER BY credits DESC, cost DESC, l.user_id LIMIT :limit""")
                .param("from", ts(from)).param("to", ts(to)).param("now", ts(now)).param("limit", limit)
                .query((rs, n) -> new TopAccountRow(rs.getObject("user_id", UUID.class), rs.getString("display_name"),
                        rs.getString("email"), rs.getString("plan"), rs.getLong("credits"), rs.getBigDecimal("cost")))
                .list();
    }
}
