package com.lingualoop.backend.stats.repository;

import static com.lingualoop.backend.stats.repository.StatsSql.ts;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.stats.dto.OverviewStatsView.Accounts;
import com.lingualoop.backend.stats.dto.OverviewStatsView.PendingReport;

import lombok.RequiredArgsConstructor;

/**
 * Số liệu tổng quan hệ thống (UC-NK-02, BR-NK-06). Đọc bảng của nhiều feature bằng câu SQL hằng, không ghi (ngoại lệ
 * của {@code stats} trong CAU-TRUC-DU-AN.md).
 */
@Repository
@RequiredArgsConstructor
public class OverviewStatsRepository {

    /** Một lượt luyện, một lượt ôn thẻ hoặc một lần dùng AI thành công trong khoảng (BR-NK-06). */
    private static final String ACTIVITY = """
            SELECT user_id, created_at FROM sentence_attempts a WHERE a.created_at >= :from AND a.created_at < :to
            UNION ALL
            SELECT user_id, created_at FROM vocab_review_logs r WHERE r.created_at >= :from AND r.created_at < :to
            UNION ALL
            SELECT user_id, created_at FROM ai_usage_logs l
            WHERE l.status = 'success' AND l.created_at >= :from AND l.created_at < :to
            """;

    private static final String DAILY_ACTIVE_USERS = """
            SELECT (x.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day, count(DISTINCT x.user_id) AS n
            FROM (""" + ACTIVITY + """
            ) x GROUP BY 1""";

    private static final String DAILY_NEW_ACCOUNTS = """
            SELECT (u.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date AS day, count(*) AS n
            FROM users u WHERE u.created_at >= :from AND u.created_at < :to GROUP BY 1""";

    private final JdbcClient jdbc;

    /** Số tài khoản tại thời điểm {@code now}, không đổi theo khoảng thời gian. */
    public Accounts accounts(Instant now) {
        return jdbc.sql("""
                SELECT count(*) AS total,
                       count(*) FILTER (WHERE role = 'student') AS students,
                       count(*) FILTER (WHERE role = 'teacher') AS teachers,
                       count(*) FILTER (WHERE role = 'admin') AS admins,
                       count(email_verified_at) AS verified,
                       (SELECT count(DISTINCT o.user_id) FROM pro_orders o JOIN users s ON s.id = o.user_id
                        WHERE s.role = 'student' AND o.status = 'paid' AND o.starts_at <= :now AND o.ends_at > :now)
                           AS active_pro
                FROM users WHERE created_at <= :now""")
                .param("now", ts(now))
                .query((rs, n) -> {
                    long students = rs.getLong("students");
                    long pro = rs.getLong("active_pro");
                    BigDecimal ratio = students == 0 ? null
                            : BigDecimal.valueOf(pro * 100).divide(BigDecimal.valueOf(students), 1,
                                    RoundingMode.HALF_UP);
                    return new Accounts(rs.getLong("total"), students, rs.getLong("teachers"), rs.getLong("admins"),
                            rs.getLong("verified"), pro, ratio);
                })
                .single();
    }

    public long newAccounts(Instant from, Instant to) {
        return jdbc.sql("SELECT count(*) FROM users u WHERE u.created_at >= :from AND u.created_at < :to")
                .param("from", ts(from)).param("to", ts(to)).query(Long.class).single();
    }

    /** Số bài học và bộ thẻ thư viện đang xuất bản. */
    public record PublishedContent(long lessons, long decks) {
    }

    public PublishedContent publishedContent() {
        return jdbc.sql("""
                SELECT (SELECT count(*) FROM lessons WHERE kind = 'library' AND status = 'published'
                            AND deleted_at IS NULL) AS lessons,
                       (SELECT count(*) FROM vocab_decks WHERE kind = 'library' AND status = 'published'
                            AND deleted_at IS NULL) AS decks""")
                .query((rs, n) -> new PublishedContent(rs.getLong("lessons"), rs.getLong("decks")))
                .single();
    }

    public long pendingAdminReports() {
        return jdbc.sql("SELECT count(*) FROM content_reports WHERE status = 'waiting_admin'").query(Long.class)
                .single();
    }

    /** Báo cáo chờ quản trị viên lâu nhất (UC-NK-02 Bước 4). */
    public List<PendingReport> oldestPendingReports(int limit) {
        return jdbc.sql("""
                SELECT cr.id, COALESCE(s.text_en, c.word) AS content, cr.reason, u.display_name, cr.created_at
                FROM content_reports cr
                LEFT JOIN sentences s ON s.id = cr.sentence_id
                LEFT JOIN vocab_cards c ON c.id = cr.card_id
                LEFT JOIN users u ON u.id = cr.reporter_id
                WHERE cr.status = 'waiting_admin'
                ORDER BY cr.created_at, cr.id LIMIT :limit""")
                .param("limit", limit)
                .query((rs, n) -> new PendingReport(rs.getObject("id", UUID.class), rs.getString("content"),
                        rs.getString("reason"), rs.getString("display_name"),
                        rs.getTimestamp("created_at").toInstant()))
                .list();
    }

    /** Số người dùng hoạt động theo ngày (giờ Việt Nam); ngày không có ai không có trong kết quả. */
    public Map<LocalDate, Long> dailyActiveUsers(Instant from, Instant to) {
        return byDay(DAILY_ACTIVE_USERS, from, to);
    }

    public Map<LocalDate, Long> dailyNewAccounts(Instant from, Instant to) {
        return byDay(DAILY_NEW_ACCOUNTS, from, to);
    }

    /** {@code sql} là một trong các hằng truy vấn theo ngày của lớp này. */
    private Map<LocalDate, Long> byDay(String sql, Instant from, Instant to) {
        Map<LocalDate, Long> result = new HashMap<>();
        jdbc.sql(sql).param("from", ts(from)).param("to", ts(to))
                .query((rs, n) -> Map.entry(rs.getObject("day", LocalDate.class), rs.getLong("n")))
                .list()
                .forEach(e -> result.put(e.getKey(), e.getValue()));
        return result;
    }
}
