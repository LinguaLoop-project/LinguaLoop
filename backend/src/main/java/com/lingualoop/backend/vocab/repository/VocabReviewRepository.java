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
 * Hàng đợi ôn thẻ của một học viên (UC-HT-03, BR-HT-13, BR-HT-14): thẻ đến hạn của mọi bộ học viên được học, gồm bộ hệ
 * thống, bộ của chính họ và bộ "Từ đã lưu".
 */
@Repository
@RequiredArgsConstructor
public class VocabReviewRepository {

    /** Số thẻ tối đa của một lượt ôn (BR-HT-14). */
    public static final int QUEUE_SIZE = 50;

    private static final String PART_INDEX = """
            WITH part_index AS (
                SELECT id, row_number() OVER (PARTITION BY deck_id ORDER BY sort_order) - 1 AS idx
                FROM vocab_groups g WHERE g.deleted_at IS NULL
                  AND EXISTS (SELECT 1 FROM vocab_cards c WHERE c.group_id = g.id AND c.deleted_at IS NULL))
            """;

    private static final String JOINS = """
            FROM vocab_cards c
            JOIN vocab_groups g ON g.id = c.group_id AND g.deleted_at IS NULL
            JOIN part_index pi ON pi.id = g.id
            JOIN vocab_decks d ON d.id = g.deck_id AND d.deleted_at IS NULL AND d.status = 'APPROVED'
                 AND ((d.visibility = 'system' AND d.kind = 'catalog') OR d.owner_id = :user)
            LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :user
            """;

    /**
     * Thẻ chưa ẩn của bộ học viên có quyền học, theo bộ nếu có {@code :deck}. Thẻ ở phần bị khoá (bộ Pro, gói Free, từ phần
     * thứ ba) không được tính vì học viên chưa có quyền học bộ đó.
     */
    private static final String VISIBLE = """
            WHERE c.deleted_at IS NULL
              AND (CAST(:deck AS text) IS NULL OR d.slug = CAST(:deck AS text))
              AND NOT (d.is_pro AND NOT :userPro AND pi.idx >= 2)
            """;

    /**
     * Đến hạn: không còn Mới và có lịch ôn không muộn hơn bây giờ (kể cả thẻ Đã thuộc), hoặc là thẻ Mới của bộ "Từ đã
     * lưu" (từ vừa lưu đến hạn ngay).
     */
    private static final String IS_DUE = """
              AND ((p.status IS NOT NULL AND p.status <> 'new' AND p.next_review_at <= now())
                   OR (d.kind = 'saved' AND (p.card_id IS NULL OR p.status = 'new')))
            """;

    private final JdbcClient jdbc;

    /** Một thẻ đến hạn kèm câu gốc của bài học nếu là từ đã lưu từ bài học. */
    public record DueCard(CardRow card, String contextEn, String contextVi, String lessonSlug, String lessonTitle) {
    }

    /** Tối đa {@link #QUEUE_SIZE} thẻ đến hạn, thẻ đến hạn sớm nhất trước; thẻ Mới của từ đã lưu xếp theo lúc lưu. */
    public List<DueCard> findDue(UUID userId, String deckSlug, boolean userPro) {
        return jdbc.sql(PART_INDEX + """
                SELECT c.id, c.word, c.pos, c.translation_vi, c.explanation_en, c.explanation_vi, c.example_en,
                       c.example_vi, c.image_url, pk.ipa AS ipa_uk, pu.ipa AS ipa_us, pk.audio_url AS audio_uk,
                       pu.audio_url AS audio_us, COALESCE(p.status, 'new') AS status,
                       COALESCE(p.repetitions, 0) AS repetitions, COALESCE(p.interval_days, 0) AS interval_days,
                       COALESCE(p.easiness_factor, 2.5) AS easiness,
                       c.context_en, c.context_vi, l.slug AS lesson_slug, l.title AS lesson_title
                """ + JOINS + """
                LEFT JOIN vocab_card_phonetics pk ON pk.card_id = c.id AND pk.accent = 'uk'
                LEFT JOIN vocab_card_phonetics pu ON pu.card_id = c.id AND pu.accent = 'us'
                LEFT JOIN user_saved_words usw ON usw.card_id = c.id AND usw.user_id = :user
                LEFT JOIN sentences se ON se.id = usw.sentence_id
                LEFT JOIN lessons l ON l.id = se.lesson_id AND l.deleted_at IS NULL AND l.status = 'APPROVED'
                """ + VISIBLE + IS_DUE + """
                ORDER BY COALESCE(CASE WHEN p.status IS NOT NULL AND p.status <> 'new' THEN p.next_review_at END, c.created_at),
                         c.id
                LIMIT :limit
                """)
                .param("user", userId).param("deck", deckSlug).param("userPro", userPro).param("limit", QUEUE_SIZE)
                .query((rs, n) -> new DueCard(
                        new CardRow(rs.getObject("id", UUID.class), rs.getString("word"), rs.getString("pos"),
                                rs.getString("translation_vi"), rs.getString("explanation_en"), rs.getString("explanation_vi"),
                                rs.getString("example_en"), rs.getString("example_vi"), rs.getString("image_url"),
                                rs.getString("ipa_uk"), rs.getString("ipa_us"), rs.getString("audio_uk"),
                                rs.getString("audio_us"), rs.getString("status"), rs.getInt("repetitions"),
                                rs.getInt("interval_days"), rs.getDouble("easiness")),
                        rs.getString("context_en"), rs.getString("context_vi"), rs.getString("lesson_slug"),
                        rs.getString("lesson_title")))
                .list();
    }

    /** Tổng số thẻ đến hạn, không giới hạn 50. */
    public int countDue(UUID userId, String deckSlug, boolean userPro) {
        return jdbc.sql(PART_INDEX + "SELECT count(*) " + JOINS + VISIBLE + IS_DUE)
                .param("user", userId).param("deck", deckSlug).param("userPro", userPro)
                .query(Integer.class).single();
    }

    /** Thời điểm sớm nhất mà một thẻ chưa đến hạn sẽ đến hạn; trống nếu không có thẻ nào được hẹn. */
    public Instant findNextDueAt(UUID userId, String deckSlug, boolean userPro) {
        Timestamp next = jdbc.sql(PART_INDEX + "SELECT min(p.next_review_at) " + JOINS + VISIBLE
                + " AND p.status IS NOT NULL AND p.status <> 'new' AND p.next_review_at > now()")
                .param("user", userId).param("deck", deckSlug).param("userPro", userPro)
                .query(Timestamp.class).optional().orElse(null);
        return next == null ? null : next.toInstant();
    }
}
