package com.lingualoop.backend.shadowing.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.shadowing.dto.PhonemeDetailView;
import com.lingualoop.backend.shadowing.dto.PhonemeStatView;
import com.lingualoop.backend.shadowing.dto.ScorePointView;

import lombok.RequiredArgsConstructor;

/**
 * Truy vấn của Thống kê điểm phát âm (UC-TH-03). Lần lỗi của một âm theo BR-TH-08: điểm dưới 60, hoặc phụ âm mà Azure
 * nghe ra một phụ âm khác âm đích. Số lần gặp và lỗi theo ngày lấy từ view {@code v_user_phoneme_stats}.
 */
@Repository
@RequiredArgsConstructor
public class ShadowingStatsRepository {

    /** Điều kiện lỗi trên một dòng {@code sentence_attempt_phonemes p} với âm đích {@code tgt} và âm nghe ra {@code heard}. */
    private static final String IS_ERROR = """
            (p.accuracy_score < 60
             OR (p.heard_phoneme_id IS DISTINCT FROM p.target_phoneme_id
                 AND tgt.kind = 'consonant' AND heard.kind = 'consonant'))""";

    private final JdbcClient jdbc;

    /** Đủ 44 âm, âm chưa gặp có 0 lần. {@code sinceDay} là ngày lịch đầu tiên của khoảng. */
    public List<PhonemeStatView> phonemeMap(UUID userId, LocalDate sinceDay) {
        return jdbc.sql("""
                SELECT p.symbol, p.kind, p.example_word,
                       COALESCE(sum(s.total), 0) AS total, COALESCE(sum(s.errors), 0) AS errors
                FROM phonemes p
                LEFT JOIN v_user_phoneme_stats s
                       ON s.phoneme_id = p.id AND s.user_id = :user AND s.day >= :since
                GROUP BY p.id, p.symbol, p.kind, p.example_word
                ORDER BY p.id""")
                .param("user", userId).param("since", sinceDay)
                .query((rs, n) -> new PhonemeStatView(rs.getString("symbol"), rs.getString("kind"),
                        rs.getString("example_word"), rs.getLong("total"), rs.getLong("errors")))
                .list();
    }

    /** Điểm Shadowing trung bình theo ngày hoặc theo tuần ({@code unit} là {@code day} hoặc {@code week}). */
    public List<ScorePointView> scoreTrend(UUID userId, Instant since, String unit) {
        return jdbc.sql("""
                SELECT date_trunc(:unit, a.created_at AT TIME ZONE u.timezone)::date AS bucket,
                       avg(a.total_score) AS average_score, count(*) AS attempts
                FROM sentence_attempts a JOIN users u ON u.id = a.user_id
                WHERE a.user_id = :user AND a.mode = 'shadowing' AND a.created_at >= :since
                GROUP BY 1 ORDER BY 1""")
                .param("user", userId).param("since", Timestamp.from(since)).param("unit", unit)
                .query((rs, n) -> new ScorePointView(rs.getObject("bucket", LocalDate.class),
                        rs.getBigDecimal("average_score").setScale(1, java.math.RoundingMode.HALF_UP),
                        rs.getLong("attempts")))
                .list();
    }

    public Optional<java.math.BigDecimal> averageScore(UUID userId, Instant from, Instant until) {
        List<java.math.BigDecimal> found = jdbc.sql("""
                SELECT avg(total_score)
                FROM sentence_attempts
                WHERE user_id = :user AND mode = 'shadowing' AND created_at >= :from AND created_at < :until""")
                .param("user", userId).param("from", Timestamp.from(from)).param("until", Timestamp.from(until))
                .query((rs, n) -> rs.getBigDecimal(1)).list();
        return found.isEmpty() ? Optional.empty() : Optional.ofNullable(found.get(0));
    }

    public Optional<PhonemeStatView> phonemeStat(UUID userId, String symbol, LocalDate sinceDay) {
        return phonemeMap(userId, sinceDay).stream().filter(p -> p.symbol().equals(symbol)).findFirst();
    }

    /** Số lần lỗi của một âm đích theo âm Azure nghe ra; {@code heard} là null khi không nghe ra âm nào. */
    public record HeardCount(String heard, long count) {
    }

    /** Mỗi dòng là một âm nghe ra (hoặc không có) kèm số lần lỗi; gồm cả lỗi do điểm thấp mà âm nghe ra vẫn đúng. */
    public List<HeardCount> errorsByHeardSymbol(UUID userId, String symbol, Instant since) {
        return jdbc.sql("""
                SELECT heard.symbol AS heard, count(*) AS n
                FROM sentence_attempt_phonemes p
                JOIN sentence_attempt_words w ON w.id = p.attempt_word_id
                JOIN sentence_attempts a ON a.id = w.attempt_id
                JOIN phonemes tgt ON tgt.id = p.target_phoneme_id
                LEFT JOIN phonemes heard ON heard.id = p.heard_phoneme_id
                WHERE a.user_id = :user AND tgt.symbol = :symbol AND a.created_at >= :since
                  AND %s
                GROUP BY heard.symbol""".formatted(IS_ERROR))
                .param("user", userId).param("symbol", symbol).param("since", Timestamp.from(since))
                .query((rs, n) -> new HeardCount(rs.getString("heard"), rs.getLong("n")))
                .list();
    }

    /** Số lần gặp và lỗi theo tuần (thứ Hai đầu tuần) từ {@code fromDay}, từ cũ đến mới. */
    public List<PhonemeDetailView.WeekPoint> weeklyTrend(UUID userId, String symbol, LocalDate fromDay) {
        return jdbc.sql("""
                SELECT date_trunc('week', s.day)::date AS week, sum(s.total) AS total, sum(s.errors) AS errors
                FROM v_user_phoneme_stats s JOIN phonemes p ON p.id = s.phoneme_id
                WHERE s.user_id = :user AND p.symbol = :symbol AND s.day >= :from
                GROUP BY 1 ORDER BY 1""")
                .param("user", userId).param("symbol", symbol).param("from", fromDay)
                .query((rs, n) -> new PhonemeDetailView.WeekPoint(rs.getObject("week", LocalDate.class),
                        rs.getLong("total"), rs.getLong("errors")))
                .list();
    }

    /**
     * Bài gần nhất học viên từng đọc sai âm đích này mà còn mở được: đã xuất bản, chưa xóa, là bài thư viện hoặc của
     * chính học viên, và không phải bài Pro khi học viên chưa có gói (BR-TH-10).
     */
    public Optional<UUID> latestOpenLessonWithError(UUID userId, String symbol, boolean pro) {
        return jdbc.sql("""
                SELECT s.lesson_id
                FROM sentence_attempt_phonemes p
                JOIN sentence_attempt_words w ON w.id = p.attempt_word_id
                JOIN sentence_attempts a ON a.id = w.attempt_id
                JOIN sentences s ON s.id = a.sentence_id AND s.deleted_at IS NULL
                JOIN lessons l ON l.id = s.lesson_id AND l.status = 'published' AND l.deleted_at IS NULL
                JOIN phonemes tgt ON tgt.id = p.target_phoneme_id
                LEFT JOIN phonemes heard ON heard.id = p.heard_phoneme_id
                WHERE a.user_id = :user AND tgt.symbol = :symbol
                  AND (l.kind = 'library' OR l.owner_id = :user)
                  AND (NOT l.is_pro OR :pro)
                  AND %s
                ORDER BY a.created_at DESC, a.id DESC
                LIMIT 1""".formatted(IS_ERROR))
                .param("user", userId).param("symbol", symbol).param("pro", pro)
                .query(UUID.class).optional();
    }
}
