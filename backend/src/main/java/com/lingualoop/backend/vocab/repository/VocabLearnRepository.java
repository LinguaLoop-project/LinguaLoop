package com.lingualoop.backend.vocab.repository;

import java.sql.ResultSet;
import java.sql.SQLException;
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

    /** Các cột của thẻ mà {@link #card(ResultSet)} đọc; cần bí danh {@code c} (thẻ) và {@code p} (tiến độ). */
    static final String CARD_COLUMNS = """
            c.id, c.word, c.pos, c.meaning_vi, c.definition_en, c.definition_vi, c.example_en, c.example_vi,
            c.ipa_uk, c.ipa_us, c.audio_uk_url, c.audio_us_url,
            """ + CardSql.STATUS + """
             AS status, COALESCE(p.repetitions, 0) AS repetitions, COALESCE(p.interval_days, 0) AS interval_days,
            COALESCE(p.ease_factor, 2.5) AS easiness
            """;

    private final JdbcClient jdbc;

    public record GroupRow(UUID id, String name) {
    }

    /** Phần thứ {@code index} (tính từ 0) của bộ, theo thứ tự thêm. */
    public Optional<GroupRow> findGroupAt(UUID deckId, int index) {
        return jdbc.sql("""
                SELECT id, name FROM vocab_groups
                WHERE deck_id = :deck AND deleted_at IS NULL
                ORDER BY created_at, id OFFSET :index LIMIT 1""")
                .param("deck", deckId).param("index", index)
                .query((rs, n) -> new GroupRow(rs.getObject("id", UUID.class), rs.getString("name")))
                .optional();
    }

    public record CardRow(UUID id, String word, String pos, String meaningVi, String definitionEn,
            String definitionVi, String exampleEn, String exampleVi, String ipaUk, String ipaUs, String audioUk,
            String audioUs, String status, int repetitions, int intervalDays, double easiness) {
    }

    static CardRow card(ResultSet rs) throws SQLException {
        return new CardRow(rs.getObject("id", UUID.class), rs.getString("word"), rs.getString("pos"),
                rs.getString("meaning_vi"), rs.getString("definition_en"), rs.getString("definition_vi"),
                rs.getString("example_en"), rs.getString("example_vi"), rs.getString("ipa_uk"), rs.getString("ipa_us"),
                rs.getString("audio_uk_url"), rs.getString("audio_us_url"), rs.getString("status"),
                rs.getInt("repetitions"), rs.getInt("interval_days"), rs.getDouble("easiness"));
    }

    /** Thẻ của phần theo thứ tự thêm, kèm lịch ôn hiện tại của {@code userId} (Mới nếu chưa có). */
    public List<CardRow> findCards(UUID userId, UUID groupId) {
        return jdbc.sql("SELECT " + CARD_COLUMNS + """
                FROM vocab_cards c
                LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :user
                WHERE c.group_id = :group AND c.deleted_at IS NULL
                ORDER BY c.created_at, c.id""")
                .param("user", userId).param("group", groupId)
                .query((rs, n) -> card(rs))
                .list();
    }

    /**
     * Đóng phiên còn mở của học viên rồi mở phiên mới (BR-HT-15); trả id phiên mới. Phiên ôn chung không thuộc bộ nào nên
     * {@code deckId} có thể trống. {@code kind} là {@code learn} hoặc {@code review}.
     */
    public UUID openSession(UUID userId, UUID deckId, String kind) {
        jdbc.sql("UPDATE vocab_sessions SET ended_at = now() WHERE user_id = :user AND ended_at IS NULL")
                .param("user", userId).update();
        return jdbc.sql("""
                INSERT INTO vocab_sessions (user_id, deck_id, kind)
                VALUES (:user, CAST(:deck AS uuid), :kind) RETURNING id""")
                .param("user", userId).param("deck", deckId).param("kind", kind)
                .query(UUID.class).single();
    }

    public boolean sessionBelongsTo(UUID sessionId, UUID userId) {
        return jdbc.sql("SELECT count(*) FROM vocab_sessions WHERE id = :id AND user_id = :user")
                .param("id", sessionId).param("user", userId).query(Long.class).single() > 0;
    }

    /** {@code library} là bộ thư viện (áp khoá Pro); bộ của chính học viên thì không khoá. */
    public record CardAccess(UUID deckId, boolean pro, boolean library) {
    }

    /**
     * Thẻ mà {@code userId} được phép trả lời: thẻ chưa ẩn của bộ thư viện đã xuất bản hoặc của bộ thuộc chính họ. Trống
     * với thẻ của người khác.
     */
    public Optional<CardAccess> findCardAccess(UUID cardId, UUID userId) {
        return jdbc.sql("""
                SELECT d.id AS deck_id, d.is_pro, (d.kind = 'library') AS library
                FROM vocab_cards c
                JOIN vocab_groups g ON g.id = c.group_id AND g.deleted_at IS NULL
                JOIN vocab_decks d ON d.id = g.deck_id
                WHERE c.id = :card AND c.deleted_at IS NULL""" + " AND " + CardSql.DECK_VISIBLE)
                .param("card", cardId).param("user", userId)
                .query((rs, n) -> new CardAccess(rs.getObject("deck_id", UUID.class), rs.getBoolean("is_pro"),
                        rs.getBoolean("library")))
                .optional();
    }

    /** Ghi một dòng nhật ký; false nếu {@code requestId} đã được ghi (gửi lại, BR-HT-16). */
    public boolean insertLog(UUID userId, UUID cardId, UUID sessionId, UUID requestId, String mode, boolean correct,
            int quality, Integer responseMs) {
        return jdbc.sql("""
                INSERT INTO vocab_review_logs (user_id, card_id, session_id, client_request_id, mode, is_correct,
                                               quality, response_ms)
                VALUES (:user, :card, :session, :request, :mode, :correct, :quality, :ms)
                ON CONFLICT ON CONSTRAINT uq_vocab_review_request DO NOTHING""")
                .param("user", userId).param("card", cardId).param("session", sessionId).param("request", requestId)
                .param("mode", mode).param("correct", correct).param("quality", quality).param("ms", responseMs)
                .update() > 0;
    }

    /** Lịch ôn đang lưu; {@code fresh} khi dòng vừa được tạo, tức thẻ còn Mới trước câu trả lời này. */
    public record ProgressRow(boolean fresh, int repetitions, int intervalDays, double easiness, Instant dueAt) {
    }

    /** Khoá dòng tiến độ của thẻ để chấm; tạo dòng nếu chưa có (hai câu trả lời cùng lúc thì xếp hàng). */
    public ProgressRow lockProgress(UUID userId, UUID cardId) {
        boolean created = jdbc.sql("""
                INSERT INTO user_card_progress (user_id, card_id, due_at) VALUES (:user, :card, now())
                ON CONFLICT DO NOTHING""")
                .param("user", userId).param("card", cardId).update() > 0;
        return jdbc.sql("""
                SELECT repetitions, interval_days, ease_factor, due_at
                FROM user_card_progress WHERE user_id = :user AND card_id = :card FOR UPDATE""")
                .param("user", userId).param("card", cardId)
                .query((rs, n) -> new ProgressRow(created, rs.getInt("repetitions"), rs.getInt("interval_days"),
                        rs.getDouble("ease_factor"), rs.getTimestamp("due_at").toInstant()))
                .single();
    }

    /** Đổi lịch ôn của thẻ; hệ số dễ chặn ở 9,99 vì cột là {@code numeric(3,2)}. */
    public void updateSchedule(UUID userId, UUID cardId, int repetitions, int intervalDays, double easiness,
            Instant dueAt) {
        jdbc.sql("""
                UPDATE user_card_progress
                SET repetitions = :reps, interval_days = :interval, ease_factor = least(:ef, 9.99), due_at = :due,
                    updated_at = now()
                WHERE user_id = :user AND card_id = :card""")
                .param("reps", repetitions).param("interval", intervalDays).param("ef", easiness)
                .param("due", Timestamp.from(dueAt)).param("user", userId).param("card", cardId).update();
    }
}
