package com.lingualoop.backend.vocab.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

/**
 * Đọc thẻ của một phần và ghi phiên học, nhật ký và tiến độ thẻ của một học viên (UC-HT-02). Viết bằng SQL thuần vì
 * các thao tác ghi cần khoá dòng và {@code ON CONFLICT}.
 */
@Repository
@RequiredArgsConstructor
public class VocabLearnRepository {

    private final JdbcClient jdbc;

    public record GroupRow(UUID id, String name, String nameVi) {
    }

    /** Phần thứ {@code index} (tính từ 0) của bộ, theo thứ tự phần. */
    public Optional<GroupRow> findGroupAt(UUID deckId, int index) {
        return jdbc.sql("""
                SELECT id, name, name_vi FROM vocab_groups
                WHERE deck_id = :deck AND deleted_at IS NULL
                ORDER BY sort_order OFFSET :index LIMIT 1""")
                .param("deck", deckId).param("index", index)
                .query((rs, n) -> new GroupRow(rs.getObject("id", UUID.class), rs.getString("name"), rs.getString("name_vi")))
                .optional();
    }

    public record CardRow(UUID id, String word, String pos, String translationVi, String explanationEn,
            String explanationVi, String exampleEn, String exampleVi, String imageUrl, String ipaUk, String ipaUs,
            String audioUk, String audioUs, String status, int repetitions, int intervalDays, double easiness) {
    }

    /** Thẻ của phần theo thứ tự, kèm phát âm hai giọng và lịch ôn hiện tại của {@code userId} (Mới nếu chưa có). */
    public List<CardRow> findCards(UUID userId, UUID groupId) {
        return jdbc.sql("""
                SELECT c.id, c.word, c.pos, c.translation_vi, c.explanation_en, c.explanation_vi, c.example_en,
                       c.example_vi, c.image_url, pk.ipa AS ipa_uk, pu.ipa AS ipa_us, pk.audio_url AS audio_uk,
                       pu.audio_url AS audio_us, COALESCE(p.status, 'new') AS status,
                       COALESCE(p.repetitions, 0) AS repetitions, COALESCE(p.interval_days, 0) AS interval_days,
                       COALESCE(p.easiness_factor, 2.5) AS easiness
                FROM vocab_cards c
                LEFT JOIN vocab_card_phonetics pk ON pk.card_id = c.id AND pk.accent = 'uk'
                LEFT JOIN vocab_card_phonetics pu ON pu.card_id = c.id AND pu.accent = 'us'
                LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :user
                WHERE c.group_id = :group AND c.deleted_at IS NULL
                ORDER BY c.sort_order""")
                .param("user", userId).param("group", groupId)
                .query((rs, n) -> new CardRow(rs.getObject("id", UUID.class), rs.getString("word"), rs.getString("pos"),
                        rs.getString("translation_vi"), rs.getString("explanation_en"), rs.getString("explanation_vi"),
                        rs.getString("example_en"), rs.getString("example_vi"), rs.getString("image_url"),
                        rs.getString("ipa_uk"), rs.getString("ipa_us"), rs.getString("audio_uk"), rs.getString("audio_us"),
                        rs.getString("status"), rs.getInt("repetitions"), rs.getInt("interval_days"),
                        rs.getDouble("easiness")))
                .list();
    }

    /**
     * Đóng phiên còn mở của học viên rồi mở phiên mới (BR-HT-15); trả id phiên mới. Phiên ôn chung không thuộc bộ hay phần
     * nào nên {@code deckId} và {@code groupId} có thể trống.
     */
    public UUID openSession(UUID userId, UUID deckId, UUID groupId, String type) {
        jdbc.sql("UPDATE vocab_study_sessions SET ended_at = now() WHERE user_id = :user AND ended_at IS NULL")
                .param("user", userId).update();
        return jdbc.sql("""
                INSERT INTO vocab_study_sessions (user_id, deck_id, group_id, session_type)
                VALUES (:user, CAST(:deck AS uuid), CAST(:group AS uuid), :type) RETURNING id""")
                .param("user", userId).param("deck", deckId).param("group", groupId).param("type", type)
                .query(UUID.class).single();
    }

    public boolean sessionBelongsTo(UUID sessionId, UUID userId) {
        return jdbc.sql("SELECT count(*) FROM vocab_study_sessions WHERE id = :id AND user_id = :user")
                .param("id", sessionId).param("user", userId).query(Long.class).single() > 0;
    }

    public record CardAccess(UUID deckId, String slug, boolean pro, boolean system, int partIndex) {
    }

    /**
     * Thẻ mà {@code userId} được phép trả lời: thẻ chưa ẩn của bộ hệ thống đã duyệt hoặc của bộ thuộc chính họ. Trống với
     * thẻ của người khác. {@code partIndex} là vị trí phần chứa thẻ, để kiểm tra khoá Pro.
     */
    public Optional<CardAccess> findCardAccess(UUID cardId, UUID userId) {
        return jdbc.sql("""
                SELECT d.id AS deck_id, d.slug, d.is_pro, (d.owner_id IS NULL) AS system,
                       (SELECT count(*) FROM vocab_groups g2
                         WHERE g2.deck_id = d.id AND g2.deleted_at IS NULL AND g2.sort_order < g.sort_order) AS part_index
                FROM vocab_cards c
                JOIN vocab_groups g ON g.id = c.group_id AND g.deleted_at IS NULL
                JOIN vocab_decks d ON d.id = g.deck_id AND d.deleted_at IS NULL AND d.status = 'APPROVED'
                WHERE c.id = :card AND c.deleted_at IS NULL
                  AND ((d.visibility = 'system' AND d.kind = 'catalog') OR d.owner_id = :user)""")
                .param("card", cardId).param("user", userId)
                .query((rs, n) -> new CardAccess(rs.getObject("deck_id", UUID.class), rs.getString("slug"),
                        rs.getBoolean("is_pro"), rs.getBoolean("system"), rs.getInt("part_index")))
                .optional();
    }

    /** Ghi một dòng nhật ký; false nếu {@code answerId} đã được ghi (gửi lại, BR-HT-16). */
    public boolean insertLog(UUID userId, UUID cardId, UUID sessionId, UUID answerId, String mode, boolean correct,
            Integer quality, Integer responseMs) {
        return jdbc.sql("""
                INSERT INTO vocab_review_logs (user_id, card_id, session_id, client_answer_id, mode, is_correct, quality, response_ms)
                VALUES (:user, :card, :session, :answer, :mode, :correct, :quality, :ms)
                ON CONFLICT (user_id, client_answer_id) WHERE client_answer_id IS NOT NULL DO NOTHING""")
                .param("user", userId).param("card", cardId).param("session", sessionId).param("answer", answerId)
                .param("mode", mode).param("correct", correct).param("quality", quality).param("ms", responseMs)
                .update() > 0;
    }

    public record ProgressRow(String status, int repetitions, int intervalDays, double easiness, Instant nextReviewAt) {
    }

    /** Khoá dòng tiến độ của thẻ để chấm; tạo dòng Mới nếu chưa có (hai câu trả lời cùng lúc thì xếp hàng). */
    public ProgressRow lockProgress(UUID userId, UUID cardId) {
        jdbc.sql("INSERT INTO user_card_progress (user_id, card_id) VALUES (:user, :card) ON CONFLICT DO NOTHING")
                .param("user", userId).param("card", cardId).update();
        return jdbc.sql("""
                SELECT status, repetitions, interval_days, easiness_factor, next_review_at
                FROM user_card_progress WHERE user_id = :user AND card_id = :card FOR UPDATE""")
                .param("user", userId).param("card", cardId)
                .query((rs, n) -> {
                    Timestamp next = rs.getTimestamp("next_review_at");
                    return new ProgressRow(rs.getString("status"), rs.getInt("repetitions"), rs.getInt("interval_days"),
                            rs.getDouble("easiness_factor"), next == null ? null : next.toInstant());
                }).single();
    }

    /** Đổi lịch ôn và trạng thái của thẻ, cộng số lần đúng hoặc sai. */
    public void updateSchedule(UUID userId, UUID cardId, String status, int repetitions, int intervalDays,
            double easiness, Instant nextReviewAt, boolean correct) {
        jdbc.sql("""
                UPDATE user_card_progress
                SET status = :status, repetitions = :reps, interval_days = :interval, easiness_factor = :ef,
                    next_review_at = :next, last_reviewed_at = now(), updated_at = now(),
                    correct_count = correct_count + :ok, incorrect_count = incorrect_count + :bad
                WHERE user_id = :user AND card_id = :card""")
                .param("status", status).param("reps", repetitions).param("interval", intervalDays).param("ef", easiness)
                .param("next", Timestamp.from(nextReviewAt)).param("ok", correct ? 1 : 0).param("bad", correct ? 0 : 1)
                .param("user", userId).param("card", cardId).update();
    }
}
