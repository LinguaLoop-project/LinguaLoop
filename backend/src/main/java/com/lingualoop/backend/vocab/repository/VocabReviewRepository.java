package com.lingualoop.backend.vocab.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.vocab.repository.VocabLearnRepository.CardRow;

import lombok.RequiredArgsConstructor;

/**
 * Hàng đợi ôn thẻ của một học viên (UC-HT-03, BR-HT-13, BR-HT-14): thẻ đến hạn của mọi bộ học viên được học, gồm bộ thư
 * viện, bộ của chính họ và bộ "Từ đã lưu". Cũng là nguồn từ mới và thẻ củng cố của khung bài ngày (BR-HT-29, BR-HT-30).
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

    /** Từ mới: thẻ Mới của bộ thư viện (BR-HT-29); thẻ Mới của bộ "Từ đã lưu" là thẻ đến hạn, không phải từ mới. */
    private static final String NEW_WORD = "p.card_id IS NULL AND d.kind = 'library'";

    /**
     * Thẻ củng cố (BR-HT-30): đã học, chưa đến hạn, chưa Đã thuộc, đang Đang học hoặc hệ số dễ dưới 2,0, và chưa được chấm
     * từ {@code :since} (đầu ngày của học viên).
     */
    private static final String REINFORCE = """
            p.card_id IS NOT NULL AND p.due_at > now() AND p.interval_days < 21
              AND (p.repetitions < 2 OR p.ease_factor < 2.0)
              AND NOT EXISTS (SELECT 1 FROM vocab_review_logs rl
                              WHERE rl.user_id = :user AND rl.card_id = c.id AND rl.created_at >= :since)""";

    /**
     * Câu truy vấn đầy đủ của từng nguồn thẻ, ghép từ hằng số lúc biên dịch: không nối chuỗi nào lúc chạy nên không có chỗ
     * cho dữ liệu ngoài lọt vào SQL (mọi giá trị đi qua tham số có tên).
     */
    private static final String CARDS_SELECT = "SELECT " + VocabLearnRepository.CARD_COLUMNS + """
            , se.text_en AS context_en, se.text_vi AS context_vi, l.id AS lesson_id, l.title AS lesson_title
            """ + JOINS + """
            LEFT JOIN sentences se ON se.id = c.source_sentence_id AND se.deleted_at IS NULL
            LEFT JOIN lessons l ON l.id = se.lesson_id AND l.deleted_at IS NULL AND l.status = 'published'
            """ + VISIBLE + " AND ";

    private static final String SQL_DUE_CARDS = CARDS_SELECT + CardSql.IS_DUE
            + " ORDER BY COALESCE(p.due_at, c.created_at), c.id LIMIT :limit";
    private static final String SQL_NEW_WORD_CARDS = CARDS_SELECT + NEW_WORD
            + " ORDER BY g.created_at, g.id, c.created_at, c.id LIMIT :limit";
    private static final String SQL_REINFORCE_CARDS = CARDS_SELECT + REINFORCE
            + " ORDER BY p.ease_factor, p.due_at, c.id LIMIT :limit";

    private static final String SQL_NEW_WORD_COUNT = "SELECT count(*) FROM (SELECT 1 " + JOINS + VISIBLE + " AND "
            + NEW_WORD + " LIMIT :cap) capped";
    private static final String SQL_REINFORCE_COUNT = "SELECT count(*) FROM (SELECT 1 " + JOINS + VISIBLE + " AND "
            + REINFORCE + " LIMIT :cap) capped";

    private final JdbcClient jdbc;

    /** Một thẻ kèm câu gốc của bài học nếu là từ đã lưu từ bài học. */
    public record DueCard(CardRow card, String contextEn, String contextVi, UUID lessonId, String lessonTitle) {
    }

    /** Tối đa {@code limit} thẻ đến hạn, thẻ đến hạn sớm nhất trước; thẻ Mới của từ đã lưu xếp theo lúc lưu. */
    public List<DueCard> findDue(UUID userId, UUID deckId, boolean userPro, int limit) {
        return cards(SQL_DUE_CARDS, params(userId, deckId, userPro), limit);
    }

    /** Tổng số thẻ đến hạn, không giới hạn 50. */
    public int countDue(UUID userId, UUID deckId, boolean userPro) {
        return jdbc.sql("SELECT count(*) " + JOINS + VISIBLE + " AND " + CardSql.IS_DUE)
                .params(params(userId, deckId, userPro))
                .query(Integer.class).single();
    }

    /** Tối đa {@code limit} từ mới của bộ {@code deckId}, theo thứ tự phần rồi thứ tự thẻ trong phần (BR-HT-29). */
    public List<DueCard> findNewWords(UUID userId, UUID deckId, boolean userPro, int limit) {
        return cards(SQL_NEW_WORD_CARDS, params(userId, deckId, userPro), limit);
    }

    /** Số từ mới còn lại của bộ, đếm tới {@code cap} (chỉ cần biết có đủ để lấp hay không). */
    public int countNewWords(UUID userId, UUID deckId, boolean userPro, int cap) {
        return cappedCount(SQL_NEW_WORD_COUNT, params(userId, deckId, userPro), cap);
    }

    /** Tối đa {@code limit} thẻ củng cố: hệ số dễ thấp trước, bằng nhau thì thẻ hẹn sớm hơn trước (BR-HT-30). */
    public List<DueCard> findReinforce(UUID userId, boolean userPro, Instant since, int limit) {
        Map<String, Object> params = params(userId, null, userPro);
        params.put("since", Timestamp.from(since));
        return cards(SQL_REINFORCE_CARDS, params, limit);
    }

    /** Số thẻ củng cố hiện có, đếm tới {@code cap}. */
    public int countReinforce(UUID userId, boolean userPro, Instant since, int cap) {
        Map<String, Object> params = params(userId, null, userPro);
        params.put("since", Timestamp.from(since));
        return cappedCount(SQL_REINFORCE_COUNT, params, cap);
    }

    /** Số thẻ đã học có lịch hẹn trong {@code [from, to)}: dùng để biết ngày mai đã nhiều thẻ chưa (BR-HT-29). */
    public int countScheduledBetween(UUID userId, boolean userPro, Instant from, Instant to) {
        Map<String, Object> params = params(userId, null, userPro);
        params.put("from", Timestamp.from(from));
        params.put("to", Timestamp.from(to));
        return jdbc.sql("SELECT count(*) " + JOINS + VISIBLE + " AND p.card_id IS NOT NULL AND p.due_at >= :from"
                + " AND p.due_at < :to")
                .params(params)
                .query(Integer.class).single();
    }

    /**
     * Số từ mới học viên đã được đưa vào từ {@code since}: thẻ của bộ không phải "Từ đã lưu" mà lần chấm đầu tiên là trong
     * lượt ôn, vào hôm nay (BR-HT-29). Thẻ học ở trang Học từ mới không tính.
     */
    public int countNewWordsStartedSince(UUID userId, Instant since) {
        return jdbc.sql("""
                SELECT count(*) FROM (
                    SELECT DISTINCT ON (l.card_id) l.card_id, l.created_at, s.kind
                    FROM vocab_review_logs l
                    LEFT JOIN vocab_sessions s ON s.id = l.session_id
                    WHERE l.user_id = :user
                      AND l.card_id IN (SELECT card_id FROM vocab_review_logs
                                        WHERE user_id = :user AND created_at >= :since)
                    ORDER BY l.card_id, l.created_at, l.id) first_log
                JOIN vocab_cards c ON c.id = first_log.card_id
                JOIN vocab_decks d ON d.id = c.deck_id
                WHERE first_log.kind = 'review' AND first_log.created_at >= :since AND d.kind <> 'saved'""")
                .param("user", userId).param("since", Timestamp.from(since))
                .query(Integer.class).single();
    }

    /**
     * Số thẻ khác nhau đã chấm trong lượt ôn từ {@code since} (đầu ngày của học viên), để trừ vào Định mức ôn ngày. Một
     * thẻ chấm nhiều lần (làm lại sau khi Quên) chỉ đếm một lần; lượt học từ mới không được tính.
     */
    public int countReviewedSince(UUID userId, Instant since) {
        return jdbc.sql("""
                SELECT count(DISTINCT l.card_id)
                FROM vocab_review_logs l
                JOIN vocab_sessions s ON s.id = l.session_id AND s.kind = 'review'
                WHERE l.user_id = :user AND l.created_at >= :since""")
                .param("user", userId).param("since", Timestamp.from(since))
                .query(Integer.class).single();
    }

    /** Thời điểm sớm nhất mà một thẻ chưa đến hạn sẽ đến hạn; trống nếu không có thẻ nào được hẹn. */
    public Instant findNextDueAt(UUID userId, UUID deckId, boolean userPro) {
        Timestamp next = jdbc.sql("SELECT min(p.due_at) " + JOINS + VISIBLE + " AND p.due_at > now()")
                .params(params(userId, deckId, userPro))
                .query(Timestamp.class).optional().orElse(null);
        return next == null ? null : next.toInstant();
    }

    private static Map<String, Object> params(UUID userId, UUID deckId, boolean userPro) {
        Map<String, Object> params = new java.util.HashMap<>();
        params.put("user", userId);
        params.put("deck", deckId);
        params.put("userPro", userPro);
        return params;
    }

    private int cappedCount(String sql, Map<String, Object> params, int cap) {
        return jdbc.sql(sql).params(params).param("cap", cap).query(Integer.class).single();
    }

    private List<DueCard> cards(String sql, Map<String, Object> params, int limit) {
        return jdbc.sql(sql)
                .params(params).param("limit", limit)
                .query((rs, n) -> new DueCard(VocabLearnRepository.card(rs), rs.getString("context_en"),
                        rs.getString("context_vi"), rs.getObject("lesson_id", UUID.class),
                        rs.getString("lesson_title")))
                .list();
    }
}
