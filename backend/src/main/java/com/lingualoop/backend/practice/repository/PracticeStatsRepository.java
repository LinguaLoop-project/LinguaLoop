package com.lingualoop.backend.practice.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.practice.dto.PracticeSessionDetailView;
import com.lingualoop.backend.practice.dto.PracticeSessionView;
import com.lingualoop.backend.practice.dto.SentenceCountsView;
import com.lingualoop.backend.practice.dto.WordClassErrorView;

import lombok.RequiredArgsConstructor;

/**
 * Các truy vấn gom của Thống kê học tập trên {@code sentence_attempts} (UC-TH-01, UC-TH-02). Chỉ đọc. "Ngày" luôn tính
 * theo múi giờ của học viên ({@code users.timezone}); {@code since} là đầu ngày đầu tiên của khoảng thống kê.
 */
@Repository
@RequiredArgsConstructor
public class PracticeStatsRepository {

    private final JdbcClient jdbc;

    /** Mọi ngày lịch có ít nhất một lượt làm (kể cả làm lại và bỏ cuộc), để tính chuỗi ngày học (BR-TH-02). */
    public Set<LocalDate> activeDays(UUID userId) {
        return Set.copyOf(jdbc.sql("""
                SELECT DISTINCT (a.created_at AT TIME ZONE u.timezone)::date
                FROM sentence_attempts a JOIN users u ON u.id = a.user_id
                WHERE a.user_id = :user""")
                .param("user", userId)
                .query(LocalDate.class).list());
    }

    public SentenceCountsView sentenceCounts(UUID userId, Instant since) {
        return jdbc.sql("""
                SELECT count(DISTINCT sentence_id) AS total,
                       count(DISTINCT sentence_id) FILTER (WHERE mode = 'dictation') AS dictation,
                       count(DISTINCT sentence_id) FILTER (WHERE mode = 'shadowing') AS shadowing
                FROM sentence_attempts
                WHERE user_id = :user AND created_at >= :since""")
                .param("user", userId).param("since", Timestamp.from(since))
                .query((rs, n) -> new SentenceCountsView(rs.getLong("total"), rs.getLong("dictation"),
                        rs.getLong("shadowing")))
                .single();
    }

    public long sentencesBetween(UUID userId, Instant from, Instant until) {
        return jdbc.sql("""
                SELECT count(DISTINCT sentence_id)
                FROM sentence_attempts
                WHERE user_id = :user AND created_at >= :from AND created_at < :until""")
                .param("user", userId).param("from", Timestamp.from(from)).param("until", Timestamp.from(until))
                .query(Long.class).single();
    }

    /**
     * Bài gần nhất có từ sai ở lượt nộp đầu tiên của từng nhóm từ, chỉ lấy bài còn mở được: đã xuất bản, chưa xóa, là
     * bài thư viện hoặc của chính học viên, không phải bài Pro khi chưa có gói (BR-TH-14). Cùng cách chọn lượt đầu như
     * {@link #dictationErrors}.
     */
    public Map<String, UUID> latestOpenLessonByWordClass(UUID userId, boolean pro) {
        Map<String, UUID> result = new HashMap<>();
        jdbc.sql("""
                WITH first_attempt AS (
                    SELECT DISTINCT ON (sentence_id) id, sentence_id, created_at
                    FROM sentence_attempts
                    WHERE user_id = :user AND mode = 'dictation' AND NOT is_retry AND NOT gave_up
                    ORDER BY sentence_id, created_at, id
                )
                SELECT DISTINCT ON (w.word_class) w.word_class, s.lesson_id
                FROM first_attempt f
                JOIN sentence_attempt_words w ON w.attempt_id = f.id
                JOIN sentences s ON s.id = f.sentence_id AND s.deleted_at IS NULL
                JOIN lessons l ON l.id = s.lesson_id AND l.status = 'published' AND l.deleted_at IS NULL
                WHERE w.word_class IS NOT NULL
                  AND w.outcome IN ('omitted', 'substituted', 'misspelled', 'revealed')
                  AND (l.kind = 'library' OR l.owner_id = :user)
                  AND (NOT l.is_pro OR :pro)
                ORDER BY w.word_class, f.created_at DESC, f.id DESC""")
                .param("user", userId).param("pro", pro)
                .query((rs, n) -> {
                    result.put(rs.getString("word_class"), rs.getObject("lesson_id", UUID.class));
                    return null;
                }).list();
        return result;
    }

    /**
     * Lỗi nghe chép theo nhóm từ trên lượt nộp đầu tiên của mỗi câu, bỏ làm lại và bỏ cuộc (BR-TH-05). Cùng cách chọn
     * lượt đầu như view {@code v_user_dictation_stats}, thêm phần tách nguyên nhân và từ sai gần nhất.
     */
    public List<WordClassErrorView> dictationErrors(UUID userId, Instant since) {
        return jdbc.sql("""
                WITH first_attempt AS (
                    SELECT DISTINCT ON (sentence_id) id, created_at
                    FROM sentence_attempts
                    WHERE user_id = :user AND mode = 'dictation' AND NOT is_retry AND NOT gave_up
                    ORDER BY sentence_id, created_at, id
                )
                SELECT w.word_class,
                       count(*) AS total,
                       count(*) FILTER (WHERE w.outcome = 'omitted') AS omitted,
                       count(*) FILTER (WHERE w.outcome = 'substituted') AS substituted,
                       count(*) FILTER (WHERE w.outcome = 'misspelled') AS misspelled,
                       count(*) FILTER (WHERE w.outcome = 'revealed') AS revealed,
                       (array_agg(w.expected_word ORDER BY f.created_at DESC, w.position DESC)
                            FILTER (WHERE w.outcome IN ('omitted', 'substituted', 'misspelled', 'revealed')))[1]
                            AS last_wrong
                FROM first_attempt f
                JOIN sentence_attempt_words w ON w.attempt_id = f.id
                WHERE f.created_at >= :since AND w.word_class IS NOT NULL
                GROUP BY w.word_class""")
                .param("user", userId).param("since", Timestamp.from(since))
                .query((rs, n) -> new WordClassErrorView(rs.getString("word_class"), rs.getLong("total"),
                        rs.getLong("omitted"), rs.getLong("substituted"), rs.getLong("misspelled"),
                        rs.getLong("revealed"), rs.getString("last_wrong")))
                .list();
    }

    /**
     * Các Buổi luyện từ mới đến cũ, tối đa {@code limit} dòng. Điểm của buổi là trung bình của điểm cao nhất mỗi câu.
     */
    public List<PracticeSessionView> practiceSessions(UUID userId, Instant since, Collection<String> modes, int limit) {
        return jdbc.sql(SESSION_ATTEMPTS + """
                , best AS (
                    SELECT lesson_id, mode, day, sentence_id, max(total_score) AS best
                    FROM att GROUP BY lesson_id, mode, day, sentence_id
                ), per_sentence AS (
                    SELECT lesson_id, mode, day, count(*) AS sentences, avg(best) AS average_best
                    FROM best GROUP BY lesson_id, mode, day
                ), per_session AS (
                    SELECT lesson_id, mode, day,
                           count(*) FILTER (WHERE is_retry AND NOT gave_up) AS retries,
                           count(*) FILTER (WHERE gave_up) AS gave_ups,
                           max(created_at) AS last_at
                    FROM att GROUP BY lesson_id, mode, day
                )
                SELECT c.lesson_id, c.mode, c.day, c.retries, c.gave_ups, c.last_at, b.sentences, b.average_best,
                       l.title, (l.status = 'published' AND l.deleted_at IS NULL) AS available
                FROM per_session c
                JOIN per_sentence b ON b.lesson_id = c.lesson_id AND b.mode = c.mode AND b.day = c.day
                JOIN lessons l ON l.id = c.lesson_id
                ORDER BY c.last_at DESC, c.lesson_id
                LIMIT :limit""")
                .param("user", userId).param("since", Timestamp.from(since)).param("modes", modes)
                .param("limit", limit)
                .query((rs, n) -> new PracticeSessionView(rs.getObject("lesson_id", UUID.class), rs.getString("title"),
                        rs.getBoolean("available"), rs.getString("mode"), rs.getObject("day", LocalDate.class),
                        rs.getInt("sentences"), rs.getBigDecimal("average_best").setScale(1, java.math.RoundingMode.HALF_UP),
                        rs.getInt("retries"), rs.getInt("gave_ups"), rs.getTimestamp("last_at").toInstant()))
                .list();
    }

    public long countPracticeSessions(UUID userId, Instant since, Collection<String> modes) {
        return jdbc.sql(SESSION_ATTEMPTS + " SELECT count(*) FROM (SELECT DISTINCT lesson_id, mode, day FROM att) s")
                .param("user", userId).param("since", Timestamp.from(since)).param("modes", modes)
                .query(Long.class).single();
    }

    /** Từng lượt của một Buổi luyện từ mới đến cũ; rỗng nếu học viên không có buổi đó. */
    public Optional<PracticeSessionDetailView> practiceSessionDetail(UUID userId, UUID lessonId, String mode,
            LocalDate day) {
        List<PracticeSessionDetailView.Attempt> attempts = jdbc.sql("""
                SELECT a.id, a.created_at, a.total_score, a.is_retry, a.gave_up, s.id AS sentence_id, s.text_en
                FROM sentence_attempts a
                JOIN users u ON u.id = a.user_id
                JOIN sentences s ON s.id = a.sentence_id
                WHERE a.user_id = :user AND s.lesson_id = :lesson AND a.mode = :mode
                  AND (a.created_at AT TIME ZONE u.timezone)::date = :day
                ORDER BY a.created_at DESC, a.id DESC""")
                .param("user", userId).param("lesson", lessonId).param("mode", mode).param("day", day)
                .query((rs, n) -> new PracticeSessionDetailView.Attempt(rs.getLong("id"),
                        rs.getObject("sentence_id", UUID.class), rs.getString("text_en"),
                        rs.getTimestamp("created_at").toInstant(), rs.getBigDecimal("total_score"),
                        rs.getBoolean("gave_up") ? "gave_up" : rs.getBoolean("is_retry") ? "retry" : "normal"))
                .list();
        if (attempts.isEmpty()) {
            return Optional.empty();
        }
        return jdbc.sql("""
                SELECT title, (status = 'published' AND deleted_at IS NULL) AS available FROM lessons WHERE id = :lesson""")
                .param("lesson", lessonId)
                .query((rs, n) -> new PracticeSessionDetailView(lessonId, rs.getString("title"),
                        rs.getBoolean("available"), attempts))
                .optional();
    }

    /** Các lượt trong khoảng, kèm bài và ngày lịch của học viên; đầu của mọi truy vấn Buổi luyện. */
    private static final String SESSION_ATTEMPTS = """
            WITH att AS (
                SELECT a.sentence_id, a.mode, a.total_score, a.is_retry, a.gave_up, a.created_at, s.lesson_id,
                       (a.created_at AT TIME ZONE u.timezone)::date AS day
                FROM sentence_attempts a
                JOIN users u ON u.id = a.user_id
                JOIN sentences s ON s.id = a.sentence_id
                WHERE a.user_id = :user AND a.created_at >= :since AND a.mode IN (:modes)
            )""";
}
