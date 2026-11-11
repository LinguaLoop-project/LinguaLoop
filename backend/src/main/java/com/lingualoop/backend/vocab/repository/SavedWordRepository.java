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
 * Từ đã lưu của học viên (ADR 0008 về từ đã lưu): mỗi nghĩa đã lưu là một thẻ trong bộ {@code kind = 'saved'} của học
 * viên, có {@code dict_word_id} và {@code dict_meaning_no}. Id của từ đã lưu là id của thẻ. Viết bằng SQL thuần vì
 * cần {@code ON CONFLICT}.
 */
@Repository
@RequiredArgsConstructor
public class SavedWordRepository {

    private final JdbcClient jdbc;

    public Optional<UUID> findSavedDeckId(UUID userId) {
        return jdbc.sql("SELECT id FROM vocab_decks WHERE owner_id = :user AND kind = 'saved'")
                .param("user", userId).query(UUID.class).optional();
    }

    /** Tạo bộ "Từ đã lưu"; hai yêu cầu cùng tạo thì một bên vi phạm ràng buộc duy nhất và được thử lại. */
    public UUID insertSavedDeck(UUID userId) {
        return jdbc.sql("""
                INSERT INTO vocab_decks (owner_id, kind, name) VALUES (:user, 'saved', 'Từ đã lưu') RETURNING id""")
                .param("user", userId).query(UUID.class).single();
    }

    public Optional<UUID> findFirstGroupId(UUID deckId) {
        return jdbc.sql("""
                SELECT id FROM vocab_groups WHERE deck_id = :deck AND deleted_at IS NULL
                ORDER BY created_at, id LIMIT 1""")
                .param("deck", deckId).query(UUID.class).optional();
    }

    public UUID insertGroup(UUID deckId) {
        return jdbc.sql("INSERT INTO vocab_groups (deck_id, name) VALUES (:deck, 'Từ đã lưu') RETURNING id")
                .param("deck", deckId).query(UUID.class).single();
    }

    /** Thẻ đang hiện của một nghĩa trong bộ "Từ đã lưu"; trống nếu chưa lưu hoặc đã bỏ lưu. */
    public Optional<UUID> findVisibleCard(UUID deckId, UUID wordId, int meaningNo) {
        return jdbc.sql("""
                SELECT id FROM vocab_cards
                WHERE deck_id = :deck AND dict_word_id = :word AND dict_meaning_no = :no AND deleted_at IS NULL""")
                .param("deck", deckId).param("word", wordId).param("no", meaningNo).query(UUID.class).optional();
    }

    /** Nội dung chép từ từ điển vào thẻ (ADR 0009). */
    public record CardContent(UUID wordId, int meaningNo, String word, String pos, String meaningVi,
            String definitionEn, String definitionVi, String exampleEn, String exampleVi, String ipaUk, String ipaUs,
            String audioUk, String audioUs, UUID sentenceId) {
    }

    /**
     * Tạo thẻ cho một nghĩa, hoặc khôi phục thẻ đã ẩn khi bỏ lưu (giữ nguyên nội dung cũ, ADR 0009; câu gốc mới thay câu
     * cũ nếu có). Tiến độ của thẻ khôi phục vẫn còn (BR-HT-04).
     */
    public UUID upsertCard(UUID deckId, UUID groupId, CardContent c) {
        return jdbc.sql("""
                INSERT INTO vocab_cards (deck_id, group_id, word, pos, meaning_vi, definition_en, definition_vi,
                                         example_en, example_vi, ipa_uk, ipa_us, audio_uk_url, audio_us_url,
                                         dict_word_id, dict_meaning_no, source_sentence_id)
                VALUES (:deck, :group, :word, :pos, :meaningVi, :defEn, :defVi, :exEn, :exVi, :ipaUk, :ipaUs,
                        :audioUk, :audioUs, :wordId, :no, :sentence)
                ON CONFLICT (deck_id, dict_word_id, dict_meaning_no) WHERE dict_word_id IS NOT NULL
                DO UPDATE SET deleted_at = NULL, updated_at = now(),
                              source_sentence_id = coalesce(EXCLUDED.source_sentence_id, vocab_cards.source_sentence_id)
                RETURNING id""")
                .param("deck", deckId).param("group", groupId).param("word", c.word()).param("pos", c.pos())
                .param("meaningVi", c.meaningVi()).param("defEn", c.definitionEn()).param("defVi", c.definitionVi())
                .param("exEn", c.exampleEn()).param("exVi", c.exampleVi()).param("ipaUk", c.ipaUk())
                .param("ipaUs", c.ipaUs()).param("audioUk", c.audioUk()).param("audioUs", c.audioUs())
                .param("wordId", c.wordId()).param("no", c.meaningNo()).param("sentence", c.sentenceId())
                .query(UUID.class).single();
    }

    /** Ẩn thẻ khi bỏ lưu; tiến độ và nhật ký được giữ để lưu lại thì khôi phục (BR-HT-04). False nếu không có thẻ đó. */
    public boolean hideCard(UUID userId, UUID cardId) {
        return jdbc.sql("""
                UPDATE vocab_cards c SET deleted_at = now(), updated_at = now()
                FROM vocab_decks d
                WHERE c.id = :card AND c.deleted_at IS NULL AND d.id = c.deck_id
                  AND d.kind = 'saved' AND d.owner_id = :user""")
                .param("card", cardId).param("user", userId).update() > 0;
    }

    public record SavedWordRow(UUID id, String headword, String pos, Integer meaningNo, String meaningVi,
            String definitionEn, String definitionVi, String exampleEn, String exampleVi, String ipaUk, String ipaUs,
            String audioUk, String audioUs, UUID sentenceId, UUID lessonId, String lessonTitle, String contextEn,
            String contextVi, String status, Instant dueAt, Instant savedAt) {
    }

    /**
     * Từ đã lưu kèm câu gốc, trạng thái và bài nguồn, mới lưu trước. Truyền {@code cardId} để lấy một dòng. Bài đã ẩn
     * hoặc chưa xuất bản thì không còn liên kết, nhưng câu gốc vẫn hiện.
     */
    public List<SavedWordRow> findRows(UUID userId, UUID cardId) {
        return jdbc.sql("""
                SELECT c.id, c.word, c.pos, c.dict_meaning_no, c.meaning_vi, c.definition_en, c.definition_vi,
                       c.example_en, c.example_vi, c.ipa_uk, c.ipa_us, c.audio_uk_url, c.audio_us_url,
                       c.source_sentence_id, l.id AS lesson_id, l.title AS lesson_title,
                       se.text_en AS context_en, se.text_vi AS context_vi,
                       """ + CardSql.STATUS + """
                        AS status, p.due_at, c.created_at
                FROM vocab_cards c
                JOIN vocab_decks d ON d.id = c.deck_id AND d.kind = 'saved' AND d.owner_id = :user
                LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :user
                LEFT JOIN sentences se ON se.id = c.source_sentence_id AND se.deleted_at IS NULL
                LEFT JOIN lessons l ON l.id = se.lesson_id AND l.deleted_at IS NULL AND l.status = 'published'
                WHERE c.deleted_at IS NULL AND (CAST(:card AS uuid) IS NULL OR c.id = CAST(:card AS uuid))
                ORDER BY c.created_at DESC, c.id""")
                .param("user", userId).param("card", cardId)
                .query((rs, n) -> new SavedWordRow(rs.getObject("id", UUID.class), rs.getString("word"),
                        rs.getString("pos"), (Integer) rs.getObject("dict_meaning_no"), rs.getString("meaning_vi"),
                        rs.getString("definition_en"), rs.getString("definition_vi"), rs.getString("example_en"),
                        rs.getString("example_vi"), rs.getString("ipa_uk"), rs.getString("ipa_us"),
                        rs.getString("audio_uk_url"), rs.getString("audio_us_url"),
                        rs.getObject("source_sentence_id", UUID.class), rs.getObject("lesson_id", UUID.class),
                        rs.getString("lesson_title"), rs.getString("context_en"), rs.getString("context_vi"),
                        rs.getString("status"), instant(rs.getTimestamp("due_at")),
                        instant(rs.getTimestamp("created_at"))))
                .list();
    }

    private static Instant instant(Timestamp ts) {
        return ts == null ? null : ts.toInstant();
    }
}
