package com.lingualoop.backend.stats.repository;

import static com.lingualoop.backend.stats.repository.StatsSql.inRange;
import static com.lingualoop.backend.stats.repository.StatsSql.planFilter;
import static com.lingualoop.backend.stats.repository.StatsSql.studentOnly;
import static com.lingualoop.backend.stats.repository.StatsSql.ts;
import static com.lingualoop.backend.stats.repository.StatsSql.vnDay;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.stats.dto.PlanFilter;
import com.lingualoop.backend.stats.dto.PracticeStatsView.RankedItem;

import lombok.RequiredArgsConstructor;

/**
 * Số liệu luyện tập toàn hệ thống (UC-NK-03) theo cách tính BR-TN-02, BR-NK-08, 12, 13: chỉ tính học viên, lọc theo
 * gói tại thời điểm luyện. Đọc bảng của nhiều feature bằng câu SQL hằng, không ghi.
 */
@Repository
@RequiredArgsConstructor
public class PracticeStatsRepository {

    private static final String ATTEMPTS = "FROM sentence_attempts a WHERE " + inRange("a") + " AND "
            + studentOnly("a") + " AND " + planFilter("a");
    private static final String REVIEWS = "FROM vocab_review_logs r WHERE " + inRange("r") + " AND "
            + studentOnly("r") + " AND " + planFilter("r");

    /**
     * Học viên hoàn thành bài ở một chế độ khi đã có lượt luyện ở chế độ đó trên mọi câu chưa xóa của bài; thời điểm
     * hoàn thành là lượt đầu tiên của câu cuối cùng được làm đủ (BR-TN-02). Mỗi học viên, bài, chế độ tính một lần.
     */
    private static final String COMPLETED = """
            WITH firsts AS (
                SELECT a.user_id, s.lesson_id, a.mode, a.sentence_id, min(a.created_at) AS t
                FROM sentence_attempts a JOIN sentences s ON s.id = a.sentence_id AND s.deleted_at IS NULL
                WHERE a.created_at < :to AND %s AND %s
                GROUP BY 1, 2, 3, 4
            ), totals AS (
                SELECT lesson_id, count(*) AS n FROM sentences WHERE deleted_at IS NULL GROUP BY 1
            ), done AS (
                SELECT user_id, lesson_id, mode, max(t) AS t, count(*) AS c FROM firsts GROUP BY 1, 2, 3
            )
            SELECT count(*) FROM done d JOIN totals x ON x.lesson_id = d.lesson_id
            WHERE d.c = x.n AND d.t >= :from AND d.t < :to
            """.formatted(studentOnly("a"), planFilter("a"));

    private final JdbcClient jdbc;

    private record ReviewCounts(long total, long correct) {
    }

    private record DailyCount(String series, LocalDate day, long count) {
    }

    /**
     * Số liệu của một khoảng. Điểm trung bình trống khi không có lượt nào; lượt "Hiện cả câu" không tính vào điểm
     * trung bình nghe chép (BR-NK-13).
     */
    public record Totals(long learners, long dictation, long shadowing, long reviews, long correctReviews,
            BigDecimal dictationAvg, BigDecimal shadowingAvg, long lessonsCompleted) {
    }

    public Totals totals(Instant from, Instant to, PlanFilter plan) {
        Map<String, Object> params = params(from, to, plan);
        Totals attempts = jdbc.sql("""
                SELECT count(*) FILTER (WHERE a.mode = 'dictation') AS dictation,
                       count(*) FILTER (WHERE a.mode = 'shadowing') AS shadowing,
                       avg(a.total_score) FILTER (WHERE a.mode = 'dictation' AND NOT a.gave_up) AS dictation_avg,
                       avg(a.total_score) FILTER (WHERE a.mode = 'shadowing') AS shadowing_avg
                """ + ATTEMPTS)
                .params(params)
                .query((rs, n) -> new Totals(0, rs.getLong("dictation"), rs.getLong("shadowing"), 0, 0,
                        rs.getBigDecimal("dictation_avg"), rs.getBigDecimal("shadowing_avg"), 0))
                .single();
        ReviewCounts reviews = jdbc.sql("SELECT count(*) AS total, count(*) FILTER (WHERE r.is_correct) AS correct "
                + REVIEWS)
                .params(params).query((rs, n) -> new ReviewCounts(rs.getLong("total"), rs.getLong("correct")))
                .single();
        long learners = jdbc.sql("SELECT count(DISTINCT x.user_id) FROM (SELECT a.user_id " + ATTEMPTS
                + " UNION SELECT r.user_id " + REVIEWS + ") x")
                .params(params).query(Long.class).single();
        long completed = jdbc.sql(COMPLETED).params(params).query(Long.class).single();
        return new Totals(learners, attempts.dictation(), attempts.shadowing(), reviews.total(), reviews.correct(),
                attempts.dictationAvg(), attempts.shadowingAvg(), completed);
    }

    /** Số lượt theo ngày (giờ Việt Nam) của nghe chép, shadowing và ôn thẻ; ngày trống không có trong kết quả. */
    public Map<String, Map<LocalDate, Long>> daily(Instant from, Instant to, PlanFilter plan) {
        Map<String, Map<LocalDate, Long>> result = new HashMap<>();
        jdbc.sql("SELECT a.mode AS series, " + vnDay("a.created_at") + " AS day, count(*) AS n " + ATTEMPTS
                + " GROUP BY 1, 2 UNION ALL SELECT 'review', " + vnDay("r.created_at") + ", count(*) " + REVIEWS
                + " GROUP BY 2")
                .params(params(from, to, plan))
                .query((rs, n) -> new DailyCount(rs.getString("series"), rs.getObject("day", LocalDate.class),
                        rs.getLong("n")))
                .list()
                .forEach(row -> result.computeIfAbsent(row.series(), k -> new HashMap<>())
                        .put(row.day(), row.count()));
        return result;
    }

    /** Bài học thư viện được luyện nhiều nhất (số lượt), bằng nhau thì theo tên tăng dần (BR-NK-08). */
    public List<RankedItem> topLessons(Instant from, Instant to, PlanFilter plan, int limit) {
        return jdbc.sql("""
                SELECT l.id, l.title AS name, o.display_name AS owner_name, count(*) AS value
                FROM sentence_attempts a
                JOIN sentences s ON s.id = a.sentence_id
                JOIN lessons l ON l.id = s.lesson_id AND l.kind = 'library'
                LEFT JOIN users o ON o.id = l.owner_id
                WHERE """ + " " + inRange("a") + " AND " + studentOnly("a") + " AND " + planFilter("a") + """

                GROUP BY l.id, l.title, o.display_name
                ORDER BY value DESC, lower(l.title), l.id LIMIT :limit""")
                .params(params(from, to, plan)).param("limit", limit)
                .query(PracticeStatsRepository::ranked).list();
    }

    /** Bộ thẻ thư viện có nhiều học viên ôn nhất, bằng nhau thì theo tên tăng dần (BR-NK-08, BR-TN-02). */
    public List<RankedItem> topDecks(Instant from, Instant to, PlanFilter plan, int limit) {
        return jdbc.sql("""
                SELECT d.id, d.name, o.display_name AS owner_name, count(DISTINCT r.user_id) AS value
                FROM vocab_review_logs r
                JOIN vocab_cards c ON c.id = r.card_id
                JOIN vocab_decks d ON d.id = c.deck_id AND d.kind = 'library'
                LEFT JOIN users o ON o.id = d.owner_id
                WHERE """ + " " + inRange("r") + " AND " + studentOnly("r") + " AND "
                + planFilter("r") + """

                GROUP BY d.id, d.name, o.display_name
                ORDER BY value DESC, lower(d.name), d.id LIMIT :limit""")
                .params(params(from, to, plan)).param("limit", limit)
                .query(PracticeStatsRepository::ranked).list();
    }

    private static RankedItem ranked(ResultSet rs, int n) throws SQLException {
        return new RankedItem(rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("owner_name"),
                rs.getLong("value"));
    }

    private static Map<String, Object> params(Instant from, Instant to, PlanFilter plan) {
        return Map.of("from", ts(from), "to", ts(to), "plan", plan.name());
    }
}
