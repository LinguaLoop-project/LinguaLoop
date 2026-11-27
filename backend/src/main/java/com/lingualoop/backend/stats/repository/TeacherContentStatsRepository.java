package com.lingualoop.backend.stats.repository;

import static com.lingualoop.backend.stats.repository.StatsSql.ts;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

/**
 * Số liệu học tập trên nội dung của một giáo viên (UC-TN-01 đến 03) theo cách tính BR-TN-02. Chỉ tính lượt của học
 * viên (bỏ giáo viên, quản trị viên xem thử) trên bài học, bộ thẻ thư viện chưa xóa và câu, thẻ chưa xóa. Đọc bảng của
 * nhiều feature bằng câu SQL hằng, không ghi.
 */
@Repository
@RequiredArgsConstructor
public class TeacherContentStatsRepository {

    private static final String STUDENT_A = "NOT EXISTS (SELECT 1 FROM users t WHERE t.id = a.user_id"
            + " AND t.role <> 'student')";
    private static final String STUDENT_R = "NOT EXISTS (SELECT 1 FROM users t WHERE t.id = r.user_id"
            + " AND t.role <> 'student')";
    private static final String IN_WINDOW_A = " a.created_at >= :from AND a.created_at < :to AND " + STUDENT_A;
    private static final String IN_WINDOW_R = " r.created_at >= :from AND r.created_at < :to AND " + STUDENT_R;

    /** Lượt luyện {@code a} trong khoảng trên câu {@code s} của bài {@code l} thuộc giáo viên {@code :teacher}. */
    private static final String TEACHER_ATTEMPTS = """
             FROM sentence_attempts a
            JOIN sentences s ON s.id = a.sentence_id AND s.deleted_at IS NULL
            JOIN lessons l ON l.id = s.lesson_id AND l.owner_id = :teacher AND l.kind = 'library'
                 AND l.deleted_at IS NULL
            WHERE""" + IN_WINDOW_A;

    /** Lượt ôn {@code r} trong khoảng trên thẻ {@code c} của bộ {@code d} thuộc giáo viên {@code :teacher}. */
    private static final String TEACHER_REVIEWS = """
             FROM vocab_review_logs r
            JOIN vocab_cards c ON c.id = r.card_id AND c.deleted_at IS NULL
            JOIN vocab_decks d ON d.id = c.deck_id AND d.owner_id = :teacher AND d.kind = 'library'
                 AND d.deleted_at IS NULL
            WHERE""" + IN_WINDOW_R;

    /** Lượt luyện {@code a} trong khoảng trên câu chưa xóa của bài {@code :lesson}. */
    private static final String LESSON_ATTEMPTS = """
             FROM sentence_attempts a
            JOIN sentences s ON s.id = a.sentence_id AND s.deleted_at IS NULL AND s.lesson_id = :lesson
            WHERE""" + IN_WINDOW_A;

    /** Thẻ {@code c} chưa xóa, thuộc nhóm {@code g} chưa xóa của bộ {@code :deck}. */
    private static final String DECK_CARDS = """
             FROM vocab_cards c
            JOIN vocab_groups g ON g.id = c.group_id AND g.deleted_at IS NULL
            WHERE c.deck_id = :deck AND c.deleted_at IS NULL""";

    /** Lượt ôn {@code r} trong khoảng trên thẻ chưa xóa của bộ {@code :deck}. */
    private static final String DECK_REVIEWS = """
             FROM vocab_review_logs r
            JOIN vocab_cards c ON c.id = r.card_id AND c.deleted_at IS NULL AND c.deck_id = :deck
            JOIN vocab_groups g ON g.id = c.group_id AND g.deleted_at IS NULL
            WHERE""" + IN_WINDOW_R;

    /**
     * Học viên hoàn thành bài khi có lượt luyện ở cùng một chế độ trên mọi câu chưa xóa của bài; thời điểm hoàn thành là
     * lúc sớm nhất làm đủ các câu ở một chế độ. Mỗi học viên tính một lần (BR-TN-02).
     */
    private static final String LESSON_COMPLETED = """
            WITH firsts AS (
                SELECT a.user_id, a.mode, a.sentence_id, min(a.created_at) AS t
                FROM sentence_attempts a
                JOIN sentences s ON s.id = a.sentence_id AND s.deleted_at IS NULL AND s.lesson_id = :lesson
                WHERE a.created_at < :to AND""" + " " + STUDENT_A + """
                GROUP BY 1, 2, 3
            ), done AS (
                SELECT user_id, mode, max(t) AS t FROM firsts GROUP BY 1, 2
                HAVING count(*) = (SELECT count(*) FROM sentences WHERE lesson_id = :lesson AND deleted_at IS NULL)
            ), completed AS (
                SELECT user_id, min(t) AS t FROM done GROUP BY 1
            )
            SELECT count(*) FROM completed WHERE t >= :from AND t < :to
            """;

    /** Trạng thái học của cặp (học viên, thẻ) suy từ tiến độ {@code p} (BR-HT-08, như {@code vocab} CardSql). */
    private static final String CARD_STATUS = """
            CASE WHEN p.card_id IS NULL THEN 'new'
                 WHEN p.interval_days >= 21 THEN 'mastered'
                 WHEN p.repetitions < 2 THEN 'learning'
                 ELSE 'reviewing' END""";

    private static final String DAY_A = "(a.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date";
    private static final String DAY_R = "(r.created_at AT TIME ZONE 'Asia/Ho_Chi_Minh')::date";

    private final JdbcClient jdbc;

    // ---------------------------------------------------------------- quyền xem (BR-TN-01)

    /** Chủ, loại và trạng thái của một bài học hoặc bộ thẻ; {@code deleted} khi đã xóa tạm. */
    public record ContentRef(UUID ownerId, String kind, String name, String status, boolean deleted) {
    }

    public Optional<ContentRef> lesson(UUID lessonId) {
        return jdbc.sql("SELECT owner_id, kind, title AS name, status, deleted_at IS NOT NULL AS deleted"
                + " FROM lessons WHERE id = :id")
                .param("id", lessonId).query(ContentRef.class).optional();
    }

    public Optional<ContentRef> deck(UUID deckId) {
        return jdbc.sql("SELECT owner_id, kind, name, status, deleted_at IS NOT NULL AS deleted"
                + " FROM vocab_decks WHERE id = :id")
                .param("id", deckId).query(ContentRef.class).optional();
    }

    // ---------------------------------------------------------------- UC-TN-01

    public record ContentCounts(long publishedLessons, long draftLessons, long publishedDecks, long draftDecks) {
    }

    /** Số bài học và bộ thẻ thư viện chưa xóa của giáo viên theo trạng thái; là số hiện tại (BR-TN-03). */
    public ContentCounts contentCounts(UUID teacherId) {
        return jdbc.sql("""
                SELECT (SELECT count(*) FILTER (WHERE status = 'published') FROM lessons
                        WHERE owner_id = :teacher AND kind = 'library' AND deleted_at IS NULL) AS published_lessons,
                       (SELECT count(*) FILTER (WHERE status = 'draft') FROM lessons
                        WHERE owner_id = :teacher AND kind = 'library' AND deleted_at IS NULL) AS draft_lessons,
                       (SELECT count(*) FILTER (WHERE status = 'published') FROM vocab_decks
                        WHERE owner_id = :teacher AND kind = 'library' AND deleted_at IS NULL) AS published_decks,
                       (SELECT count(*) FILTER (WHERE status = 'draft') FROM vocab_decks
                        WHERE owner_id = :teacher AND kind = 'library' AND deleted_at IS NULL) AS draft_decks""")
                .param("teacher", teacherId).query(ContentCounts.class).single();
    }

    /** Tổng lượt luyện (nghe chép và shadowing) trên bài học của giáo viên trong khoảng. */
    public long practiceAttempts(UUID teacherId, Instant from, Instant to) {
        return jdbc.sql("SELECT count(*)" + TEACHER_ATTEMPTS)
                .params(teacherParams(teacherId, from, to)).query(Long.class).single();
    }

    /** Số học viên có ít nhất một lượt luyện trên bài học hoặc một lượt ôn trên bộ thẻ của giáo viên (BR-TN-02). */
    public long learners(UUID teacherId, Instant from, Instant to) {
        return jdbc.sql("SELECT count(*) FROM (SELECT a.user_id" + TEACHER_ATTEMPTS
                + " UNION SELECT r.user_id" + TEACHER_REVIEWS + ") u")
                .params(teacherParams(teacherId, from, to)).query(Long.class).single();
    }

    /** Số lượt theo ngày trên nội dung của giáo viên: nghe chép, shadowing và ôn thẻ; ngày trống không có. */
    public Map<String, Map<LocalDate, Long>> overviewDaily(UUID teacherId, Instant from, Instant to) {
        return daily("SELECT a.mode AS series, " + DAY_A + " AS day, count(*) AS n" + TEACHER_ATTEMPTS
                + " GROUP BY 1, 2 UNION ALL SELECT 'review', " + DAY_R + ", count(*)" + TEACHER_REVIEWS
                + " GROUP BY 1, 2", teacherParams(teacherId, from, to));
    }

    public record TopLessonRow(UUID id, String title, long learners, long attempts, BigDecimal dictationAvg,
            BigDecimal shadowingAvg) {
    }

    /** Bài học có nhiều học viên luyện nhất, bằng nhau thì theo tên tăng dần (BR-TN-04). */
    public List<TopLessonRow> topLessons(UUID teacherId, Instant from, Instant to, int limit) {
        return jdbc.sql("""
                SELECT l.id, l.title, count(DISTINCT a.user_id) AS learners, count(*) AS attempts,
                       avg(a.total_score) FILTER (WHERE a.mode = 'dictation') AS dictation_avg,
                       avg(a.total_score) FILTER (WHERE a.mode = 'shadowing') AS shadowing_avg
                """ + TEACHER_ATTEMPTS + """
                 GROUP BY l.id, l.title
                ORDER BY learners DESC, lower(l.title), l.id LIMIT :limit""")
                .params(teacherParams(teacherId, from, to)).param("limit", limit)
                .query(TopLessonRow.class).list();
    }

    public record TopDeckRow(UUID id, String name, long learners, long reviews, long correct) {
    }

    /** Bộ thẻ có nhiều học viên ôn nhất, bằng nhau thì theo tên tăng dần (BR-TN-04). */
    public List<TopDeckRow> topDecks(UUID teacherId, Instant from, Instant to, int limit) {
        return jdbc.sql("""
                SELECT d.id, d.name, count(DISTINCT r.user_id) AS learners, count(*) AS reviews,
                       count(*) FILTER (WHERE r.is_correct) AS correct
                """ + TEACHER_REVIEWS + """
                 GROUP BY d.id, d.name
                ORDER BY learners DESC, lower(d.name), d.id LIMIT :limit""")
                .params(teacherParams(teacherId, from, to)).param("limit", limit)
                .query(TopDeckRow.class).list();
    }

    // ---------------------------------------------------------------- UC-TN-02

    public record LessonTotals(long started, long dictation, long shadowing, BigDecimal dictationAvg,
            BigDecimal shadowingAvg) {
    }

    public LessonTotals lessonTotals(UUID lessonId, Instant from, Instant to) {
        return jdbc.sql("""
                SELECT count(DISTINCT a.user_id) AS started,
                       count(*) FILTER (WHERE a.mode = 'dictation') AS dictation,
                       count(*) FILTER (WHERE a.mode = 'shadowing') AS shadowing,
                       avg(a.total_score) FILTER (WHERE a.mode = 'dictation') AS dictation_avg,
                       avg(a.total_score) FILTER (WHERE a.mode = 'shadowing') AS shadowing_avg
                """ + LESSON_ATTEMPTS)
                .params(lessonParams(lessonId, from, to)).query(LessonTotals.class).single();
    }

    public long lessonCompleted(UUID lessonId, Instant from, Instant to) {
        return jdbc.sql(LESSON_COMPLETED).params(lessonParams(lessonId, from, to)).query(Long.class).single();
    }

    /** Số lượt theo ngày (giờ Việt Nam) của từng chế độ; ngày trống không có trong kết quả. */
    public Map<String, Map<LocalDate, Long>> lessonDaily(UUID lessonId, Instant from, Instant to) {
        return daily("SELECT a.mode AS series, " + DAY_A + " AS day, count(*) AS n" + LESSON_ATTEMPTS
                + " GROUP BY 1, 2", lessonParams(lessonId, from, to));
    }

    /** {@code order} là thứ tự câu trong bài (theo mốc bắt đầu), tính trên các câu chưa xóa. */
    public record HardSentenceRow(UUID id, int order, String text, long attempts, BigDecimal avgScore) {
    }

    /**
     * Câu khó nhất của bài ở một chế độ: câu có ít nhất {@code minAttempts} lượt ở chế độ đó, điểm trung bình tăng dần,
     * bằng nhau thì theo thứ tự trong bài (BR-TN-04).
     */
    public List<HardSentenceRow> hardSentences(UUID lessonId, String mode, Instant from, Instant to,
            int minAttempts, int limit) {
        return jdbc.sql("""
                WITH ordered AS (
                    SELECT s.id, s.text_en, row_number() OVER (ORDER BY s.start_ms, s.id) AS ord
                    FROM sentences s WHERE s.lesson_id = :lesson AND s.deleted_at IS NULL
                )
                SELECT o.id, o.ord AS "order", o.text_en AS text, count(*) AS attempts,
                       avg(a.total_score) AS avg_score
                FROM ordered o
                JOIN sentence_attempts a ON a.sentence_id = o.id AND a.mode = :mode AND""" + IN_WINDOW_A + """

                GROUP BY o.id, o.ord, o.text_en
                HAVING count(*) >= :minAttempts
                ORDER BY avg_score, o.ord LIMIT :limit""")
                .params(lessonParams(lessonId, from, to)).param("mode", mode).param("minAttempts", minAttempts)
                .param("limit", limit).query(HardSentenceRow.class).list();
    }

    // ---------------------------------------------------------------- UC-TN-03

    public record DeckTotals(long learners, long reviews, long correct) {
    }

    public DeckTotals deckTotals(UUID deckId, Instant from, Instant to) {
        return jdbc.sql("SELECT count(DISTINCT r.user_id) AS learners, count(*) AS reviews,"
                + " count(*) FILTER (WHERE r.is_correct) AS correct" + DECK_REVIEWS)
                .params(deckParams(deckId, from, to)).query(DeckTotals.class).single();
    }

    /** Số lượt ôn và số lượt đúng theo ngày (giờ Việt Nam) trên thẻ chưa xóa của bộ; ngày trống không có. */
    public Map<String, Map<LocalDate, Long>> deckDaily(UUID deckId, Instant from, Instant to) {
        return daily("SELECT 'reviews' AS series, " + DAY_R + " AS day, count(*) AS n" + DECK_REVIEWS
                + " GROUP BY 1, 2 UNION ALL SELECT 'correct', " + DAY_R + ", count(*)" + DECK_REVIEWS
                + " AND r.is_correct GROUP BY 1, 2", deckParams(deckId, from, to));
    }

    public record StateCount(String status, long pairs) {
    }

    /**
     * Số cặp (học viên, thẻ) theo trạng thái học hiện tại, trên các học viên đã ôn bộ trong khoảng (BR-TN-02). Không có
     * học viên nào thì kết quả rỗng.
     */
    public List<StateCount> deckStates(UUID deckId, Instant from, Instant to) {
        return jdbc.sql("""
                WITH learners AS (
                    SELECT DISTINCT r.user_id""" + DECK_REVIEWS + """

                ), cards AS (
                    SELECT c.id""" + DECK_CARDS + """

                )
                SELECT\s""" + CARD_STATUS + """
                 AS status, count(*) AS pairs
                FROM learners u CROSS JOIN cards x
                LEFT JOIN user_card_progress p ON p.user_id = u.user_id AND p.card_id = x.id
                GROUP BY 1""")
                .params(deckParams(deckId, from, to)).query(StateCount.class).list();
    }

    public record GroupRow(UUID id, String name) {
    }

    /** Nhóm thẻ chưa xóa của bộ theo thứ tự trong bộ. */
    public List<GroupRow> deckGroups(UUID deckId) {
        return jdbc.sql("SELECT g.id, g.name FROM vocab_groups g WHERE g.deck_id = :deck AND g.deleted_at IS NULL"
                + " ORDER BY g.created_at, g.id")
                .param("deck", deckId).query(GroupRow.class).list();
    }

    public record HardCardRow(UUID id, UUID groupId, String word, long reviews, long correct) {
    }

    /**
     * Tối đa {@code limit} thẻ khó nhất của mỗi nhóm: thẻ có ít nhất {@code minReviews} lượt ôn, tỷ lệ đúng tăng dần,
     * bằng nhau thì theo thứ tự thẻ trong nhóm (BR-TN-04). Kết quả xếp theo nhóm rồi theo thứ hạng.
     */
    public List<HardCardRow> hardCards(UUID deckId, Instant from, Instant to, int minReviews, int limit) {
        return jdbc.sql("""
                WITH stats AS (
                    SELECT c.id, c.group_id, c.word, c.created_at, count(*) AS reviews,
                           count(*) FILTER (WHERE r.is_correct) AS correct
                    """ + DECK_REVIEWS + """

                    GROUP BY c.id, c.group_id, c.word, c.created_at
                    HAVING count(*) >= :minReviews
                ), ranked AS (
                    SELECT stats.*, row_number() OVER (PARTITION BY group_id
                           ORDER BY correct::numeric / reviews, created_at, id) AS rn
                    FROM stats
                )
                SELECT id, group_id, word, reviews, correct FROM ranked WHERE rn <= :limit
                ORDER BY group_id, rn""")
                .params(deckParams(deckId, from, to)).param("minReviews", minReviews).param("limit", limit)
                .query(HardCardRow.class).list();
    }

    private record DailyCount(String series, LocalDate day, long count) {
    }

    /** Gom kết quả {@code (series, day, n)} thành chuỗi theo ngày. */
    private Map<String, Map<LocalDate, Long>> daily(String sql, Map<String, Object> params) {
        Map<String, Map<LocalDate, Long>> result = new HashMap<>();
        jdbc.sql(sql).params(params)
                .query((rs, n) -> new DailyCount(rs.getString("series"), rs.getObject("day", LocalDate.class),
                        rs.getLong("n")))
                .list()
                .forEach(row -> result.computeIfAbsent(row.series(), k -> new HashMap<>())
                        .put(row.day(), row.count()));
        return result;
    }

    private static Map<String, Object> teacherParams(UUID teacherId, Instant from, Instant to) {
        return Map.of("teacher", teacherId, "from", ts(from), "to", ts(to));
    }

    private static Map<String, Object> lessonParams(UUID lessonId, Instant from, Instant to) {
        return Map.of("lesson", lessonId, "from", ts(from), "to", ts(to));
    }

    private static Map<String, Object> deckParams(UUID deckId, Instant from, Instant to) {
        return Map.of("deck", deckId, "from", ts(from), "to", ts(to));
    }
}
