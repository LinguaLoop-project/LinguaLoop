package com.lingualoop.backend.vocab.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.vocab.dto.VocabStatsView;

import lombok.RequiredArgsConstructor;

/** Truy vấn gom của Thống kê học tập trên dữ liệu học từ vựng (UC-TH-01, UC-TH-02). Chỉ đọc. */
@Repository
@RequiredArgsConstructor
public class VocabStatsRepository {

    private final JdbcClient jdbc;

    /** Ngày lịch có ít nhất một câu trả lời thẻ, không cần xong cả lượt (BR-TH-02). */
    public Set<LocalDate> activeDays(UUID userId) {
        return Set.copyOf(jdbc.sql("""
                SELECT DISTINCT (l.created_at AT TIME ZONE u.timezone)::date
                FROM vocab_review_logs l JOIN users u ON u.id = l.user_id
                WHERE l.user_id = :user""")
                .param("user", userId)
                .query(LocalDate.class).list());
    }

    /** Thẻ chưa xóa của các bộ mà học viên đã có tiến độ ở ít nhất một thẻ, theo trạng thái. */
    public VocabStatsView.CardCounts cardCounts(UUID userId) {
        return jdbc.sql("""
                WITH started AS (
                    SELECT DISTINCT c0.deck_id
                    FROM user_card_progress p0 JOIN vocab_cards c0 ON c0.id = p0.card_id
                    WHERE p0.user_id = :user
                )
                SELECT count(*) FILTER (WHERE status = 'new') AS new_count,
                       count(*) FILTER (WHERE status = 'learning') AS learning,
                       count(*) FILTER (WHERE status = 'reviewing') AS reviewing,
                       count(*) FILTER (WHERE status = 'mastered') AS mastered
                FROM (
                    SELECT %s AS status
                    FROM vocab_cards c
                    JOIN started s ON s.deck_id = c.deck_id
                    JOIN vocab_decks d ON d.id = c.deck_id
                    LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :user
                    WHERE c.deleted_at IS NULL AND %s
                ) t""".formatted(CardSql.STATUS, CardSql.DECK_VISIBLE))
                .param("user", userId)
                .query((rs, n) -> new VocabStatsView.CardCounts(rs.getLong("new_count"), rs.getLong("learning"),
                        rs.getLong("reviewing"), rs.getLong("mastered")))
                .single();
    }

    public VocabStatsView.AnswerStats answerStats(UUID userId, Instant since) {
        return jdbc.sql("""
                SELECT count(*) FILTER (WHERE is_correct) AS correct, count(*) AS total
                FROM vocab_review_logs
                WHERE user_id = :user AND created_at >= :since""")
                .param("user", userId).param("since", Timestamp.from(since))
                .query((rs, n) -> new VocabStatsView.AnswerStats(rs.getLong("correct"), rs.getLong("total")))
                .single();
    }

    /** Phiên đã có ít nhất một câu trả lời, từ mới đến cũ, tối đa {@code limit} dòng. */
    public List<VocabStatsView.Session> sessions(UUID userId, Instant since, int limit) {
        return jdbc.sql("""
                SELECT s.id, s.deck_id, d.name, d.kind AS deck_kind, s.kind, s.started_at, count(l.id) AS answered,
                       count(l.id) FILTER (WHERE l.is_correct) AS correct,
                       (d.id IS NOT NULL AND d.deleted_at IS NULL
                        AND (d.kind <> 'library' OR d.status = 'published')) AS available
                FROM vocab_sessions s
                JOIN vocab_review_logs l ON l.session_id = s.id
                LEFT JOIN vocab_decks d ON d.id = s.deck_id
                WHERE s.user_id = :user AND s.started_at >= :since
                GROUP BY s.id, d.id
                ORDER BY s.started_at DESC, s.id
                LIMIT :limit""")
                .param("user", userId).param("since", Timestamp.from(since)).param("limit", limit)
                .query((rs, n) -> new VocabStatsView.Session(rs.getObject("id", UUID.class),
                        rs.getObject("deck_id", UUID.class), rs.getString("name"), rs.getString("deck_kind"),
                        rs.getBoolean("available"), rs.getString("kind"), rs.getTimestamp("started_at").toInstant(), rs.getInt("answered"),
                        rs.getInt("correct")))
                .list();
    }

    public long countSessions(UUID userId, Instant since) {
        return jdbc.sql("""
                SELECT count(DISTINCT s.id)
                FROM vocab_sessions s JOIN vocab_review_logs l ON l.session_id = s.id
                WHERE s.user_id = :user AND s.started_at >= :since""")
                .param("user", userId).param("since", Timestamp.from(since))
                .query(Long.class).single();
    }
}
