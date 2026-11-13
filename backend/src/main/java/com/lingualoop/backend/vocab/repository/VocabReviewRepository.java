package com.lingualoop.backend.vocab.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.vocab.repository.VocabLearnRepository.CardRow;

import lombok.RequiredArgsConstructor;

/**
 * Hàng đợi ôn thẻ của một học viên (UC-HT-03, BR-HT-13, BR-HT-14): thẻ đến hạn của mọi bộ học viên được học, gồm bộ thư
 * viện, bộ của chính họ và bộ "Từ đã lưu".
 */
@Repository
@RequiredArgsConstructor
public class VocabReviewRepository {

    /** Số thẻ tối đa của một lượt ôn (BR-HT-14). */
    public static final int QUEUE_SIZE = 50;

    private static final String JOINS = """
            FROM vocab_cards c
            JOIN vocab_groups g ON g.id = c.group_id AND g.deleted_at IS NULL
            JOIN vocab_decks d ON d.id = g.deck_id
            LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :user
            """;

    /**
     * Thẻ chưa ẩn của bộ học viên có quyền học, theo bộ nếu có {@code :deck}. Thẻ của bộ Pro không được tính với gói Free
     * vì học viên chưa có quyền học bộ đó.
     */
    private static final String VISIBLE = "WHERE c.deleted_at IS NULL AND " + CardSql.DECK_VISIBLE + """

              AND (CAST(:deck AS uuid) IS NULL OR d.id = CAST(:deck AS uuid))
              AND NOT (d.is_pro AND NOT :userPro)
            """;

    private final JdbcClient jdbc;

    /** Một thẻ đến hạn kèm câu gốc của bài học nếu là từ đã lưu từ bài học. */
    public record DueCard(CardRow card, String contextEn, String contextVi, UUID lessonId, String lessonTitle) {
    }

    /** Tối đa {@link #QUEUE_SIZE} thẻ đến hạn, thẻ đến hạn sớm nhất trước; thẻ Mới của từ đã lưu xếp theo lúc lưu. */
    public List<DueCard> findDue(UUID userId, UUID deckId, boolean userPro) {
        return jdbc.sql("SELECT " + VocabLearnRepository.CARD_COLUMNS + """
                , se.text_en AS context_en, se.text_vi AS context_vi, l.id AS lesson_id, l.title AS lesson_title
                """ + JOINS + """
                LEFT JOIN sentences se ON se.id = c.source_sentence_id AND se.deleted_at IS NULL
                LEFT JOIN lessons l ON l.id = se.lesson_id AND l.deleted_at IS NULL AND l.status = 'published'
                """ + VISIBLE + " AND " + CardSql.IS_DUE + """

                ORDER BY COALESCE(p.due_at, c.created_at), c.id
                LIMIT :limit
                """)
                .param("user", userId).param("deck", deckId).param("userPro", userPro).param("limit", QUEUE_SIZE)
                .query((rs, n) -> new DueCard(VocabLearnRepository.card(rs), rs.getString("context_en"),
                        rs.getString("context_vi"), rs.getObject("lesson_id", UUID.class),
                        rs.getString("lesson_title")))
                .list();
    }

    /** Tổng số thẻ đến hạn, không giới hạn 50. */
    public int countDue(UUID userId, UUID deckId, boolean userPro) {
        return jdbc.sql("SELECT count(*) " + JOINS + VISIBLE + " AND " + CardSql.IS_DUE)
                .param("user", userId).param("deck", deckId).param("userPro", userPro)
                .query(Integer.class).single();
    }

    /** Thời điểm sớm nhất mà một thẻ chưa đến hạn sẽ đến hạn; trống nếu không có thẻ nào được hẹn. */
    public Instant findNextDueAt(UUID userId, UUID deckId, boolean userPro) {
        Timestamp next = jdbc.sql("SELECT min(p.due_at) " + JOINS + VISIBLE + " AND p.due_at > now()")
                .param("user", userId).param("deck", deckId).param("userPro", userPro)
                .query(Timestamp.class).optional().orElse(null);
        return next == null ? null : next.toInstant();
    }
}
