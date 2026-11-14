package com.lingualoop.backend.vocab.repository;

import java.sql.Timestamp;
import java.sql.Types;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.CardRequest;

import lombok.RequiredArgsConstructor;

/**
 * Ghi nhóm thẻ và thẻ của bộ thư viện (UC-NT-01 đến UC-NT-07). Xóa là xóa tạm bằng {@code deleted_at} (BR-NT-04).
 * Thứ tự nhóm và thẻ theo {@code created_at} rồi {@code id}, nên lệnh thêm truyền thời điểm tạo tăng dần thay vì
 * {@code now()} (trong một giao dịch {@code now()} không đổi). Service khóa dòng bộ trước khi gọi các lệnh ghi.
 */
@Repository
@RequiredArgsConstructor
public class VocabDeckContentRepository {

    private final JdbcClient jdbc;

    /** Nhóm chưa xóa thuộc đúng bộ, kèm số thẻ chưa xóa. */
    public Optional<DeckManageView.Group> findGroup(UUID deckId, UUID groupId) {
        return jdbc.sql("""
                SELECT g.id, g.name,
                       (SELECT count(*) FROM vocab_cards c WHERE c.group_id = g.id AND c.deleted_at IS NULL) AS card_count
                FROM vocab_groups g
                WHERE g.id = :group AND g.deck_id = :deck AND g.deleted_at IS NULL""")
                .param("group", groupId).param("deck", deckId)
                .query(DeckManageView.Group.class).optional();
    }

    /** Bộ đã có nhóm chưa xóa cùng tên, không phân biệt hoa thường, trừ nhóm {@code excludeGroupId} (BR-NT-02). */
    public boolean existsGroupName(UUID deckId, String name, UUID excludeGroupId) {
        return jdbc.sql("""
                SELECT EXISTS (SELECT 1 FROM vocab_groups
                               WHERE deck_id = :deck AND lower(name) = lower(:name) AND deleted_at IS NULL
                                 AND (CAST(:exclude AS uuid) IS NULL OR id <> CAST(:exclude AS uuid)))""")
                .param("deck", deckId).param("name", name)
                .param("exclude", textOf(excludeGroupId), Types.VARCHAR)
                .query(Boolean.class).single();
    }

    public UUID insertGroup(UUID deckId, String name, Instant createdAt) {
        return jdbc.sql("""
                INSERT INTO vocab_groups (deck_id, name, created_at, updated_at)
                VALUES (:deck, :name, :at, :at) RETURNING id""")
                .param("deck", deckId).param("name", name).param("at", Timestamp.from(createdAt))
                .query(UUID.class).single();
    }

    public void renameGroup(UUID groupId, String name, Instant now) {
        jdbc.sql("UPDATE vocab_groups SET name = :name, updated_at = :now WHERE id = :group")
                .param("name", name).param("now", Timestamp.from(now)).param("group", groupId)
                .update();
    }

    /** Xóa tạm nhóm cùng mọi thẻ chưa xóa của nhóm (BR-NT-04). */
    public void softDeleteGroup(UUID groupId, Instant now) {
        Timestamp at = Timestamp.from(now);
        jdbc.sql("UPDATE vocab_cards SET deleted_at = :now WHERE group_id = :group AND deleted_at IS NULL")
                .param("now", at).param("group", groupId).update();
        jdbc.sql("UPDATE vocab_groups SET deleted_at = :now WHERE id = :group AND deleted_at IS NULL")
                .param("now", at).param("group", groupId).update();
    }

    /** Thẻ chưa xóa thuộc đúng nhóm chưa xóa của bộ; {@code imageUrl} là S3 key chưa đổi thành URL. */
    public Optional<DeckManageView.Card> findCard(UUID deckId, UUID groupId, UUID cardId) {
        return jdbc.sql("""
                SELECT c.id, c.word, c.pos, c.ipa_uk, c.ipa_us, c.meaning_vi, c.definition_en, c.definition_vi,
                       c.example_en, c.example_vi, c.image_url,
                       c.audio_uk_url AS audio_uk, c.audio_us_url AS audio_us
                FROM vocab_cards c
                JOIN vocab_groups g ON g.id = c.group_id AND g.deleted_at IS NULL
                WHERE c.id = :card AND c.group_id = :group AND c.deck_id = :deck AND c.deleted_at IS NULL""")
                .param("card", cardId).param("group", groupId).param("deck", deckId)
                .query(DeckManageView.Card.class).optional();
    }

    /** Thẻ chưa xóa đang dùng một từ trong bộ (BR-BT-04, cùng điều kiện {@code uq_vocab_cards_word}). */
    public record WordOwner(UUID cardId, UUID groupId, String groupName, String word) {
    }

    public Optional<WordOwner> findCardWithWord(UUID deckId, String word, UUID excludeCardId) {
        return jdbc.sql("""
                SELECT c.id AS card_id, c.group_id, g.name AS group_name, c.word
                FROM vocab_cards c
                JOIN vocab_groups g ON g.id = c.group_id
                WHERE c.deck_id = :deck AND lower(c.word) = lower(:word) AND c.deleted_at IS NULL
                  AND c.dict_word_id IS NULL
                  AND (CAST(:exclude AS uuid) IS NULL OR c.id <> CAST(:exclude AS uuid))
                LIMIT 1""")
                .param("deck", deckId).param("word", word)
                .param("exclude", textOf(excludeCardId), Types.VARCHAR)
                .query(WordOwner.class).optional();
    }

    /** Từ vựng (chữ thường) của mọi thẻ chưa xóa trong bộ, để kiểm trùng khi nhập từ tệp. */
    public Set<String> findActiveWordKeys(UUID deckId) {
        return new HashSet<>(jdbc.sql("""
                SELECT lower(word) FROM vocab_cards
                WHERE deck_id = :deck AND deleted_at IS NULL AND dict_word_id IS NULL""")
                .param("deck", deckId).query(String.class).list());
    }

    /**
     * Đường dẫn âm thanh Anh-Anh, Anh-Mỹ của thẻ, chép từ từ điển (BR-NT-08); trống thì học viên nghe giọng đọc của
     * trình duyệt.
     */
    public record CardAudio(String uk, String us) {

        public static final CardAudio NONE = new CardAudio(null, null);
    }

    /** Thêm thẻ; {@code image} là S3 key của ảnh đã kiểm, trống = không có ảnh. */
    public UUID insertCard(UUID deckId, UUID groupId, CardRequest card, CardAudio audio, String image,
            Instant createdAt) {
        return jdbc.sql("""
                INSERT INTO vocab_cards (deck_id, group_id, word, meaning_vi, ipa_uk, ipa_us, pos, definition_en,
                                         definition_vi, example_en, example_vi, audio_uk_url, audio_us_url,
                                         image_url, created_at, updated_at)
                VALUES (:deck, :group, :word, :meaningVi, :ipaUk, :ipaUs, :pos, :definitionEn, :definitionVi,
                        :exampleEn, :exampleVi, :audioUk, :audioUs, :image, :at, :at)
                RETURNING id""")
                .paramSource(cardParams(card, audio, image)
                        .addValue("deck", deckId).addValue("group", groupId)
                        .addValue("at", Timestamp.from(createdAt)))
                .query(UUID.class).single();
    }

    private static String textOf(UUID id) {
        return id == null ? null : id.toString();
    }

    /** Các mục nội dung của thẻ theo tên tham số SQL; mục trống là {@code NULL} kiểu text. */
    private static MapSqlParameterSource cardParams(CardRequest card, CardAudio audio, String image) {
        return new MapSqlParameterSource()
                .addValue("image", image, Types.VARCHAR)
                .addValue("audioUk", audio.uk(), Types.VARCHAR)
                .addValue("audioUs", audio.us(), Types.VARCHAR)
                .addValue("word", card.word())
                .addValue("meaningVi", card.meaningVi())
                .addValue("ipaUk", card.ipaUk(), Types.VARCHAR)
                .addValue("ipaUs", card.ipaUs(), Types.VARCHAR)
                .addValue("pos", card.pos(), Types.VARCHAR)
                .addValue("definitionEn", card.definitionEn(), Types.VARCHAR)
                .addValue("definitionVi", card.definitionVi(), Types.VARCHAR)
                .addValue("exampleEn", card.exampleEn(), Types.VARCHAR)
                .addValue("exampleVi", card.exampleVi(), Types.VARCHAR);
    }

    /** Lưu nội dung thẻ; {@code image} là S3 key mới (hoặc key cũ nếu giữ ảnh), trống = bỏ ảnh. */
    public void updateCard(UUID cardId, CardRequest card, CardAudio audio, String image, Instant now) {
        jdbc.sql("""
                UPDATE vocab_cards
                   SET word = :word, meaning_vi = :meaningVi, ipa_uk = :ipaUk, ipa_us = :ipaUs, pos = :pos,
                       definition_en = :definitionEn, definition_vi = :definitionVi, example_en = :exampleEn,
                       example_vi = :exampleVi, audio_uk_url = :audioUk, audio_us_url = :audioUs,
                       image_url = :image, updated_at = :now
                 WHERE id = :card""")
                .paramSource(cardParams(card, audio, image).addValue("now", Timestamp.from(now)).addValue("card", cardId))
                .update();
    }

    /** Từ vựng và ảnh hiện có (S3 key) của một thẻ trong nhóm, để ghép ảnh theo tên tệp (BR-NT-09). */
    public record CardImageRow(UUID id, String word, String imageUrl) {
    }

    /** Thẻ chưa xóa của nhóm, theo thứ tự trong nhóm. */
    public List<CardImageRow> findGroupCardImages(UUID groupId) {
        return jdbc.sql("""
                SELECT id, word, image_url FROM vocab_cards
                WHERE group_id = :group AND deleted_at IS NULL
                ORDER BY created_at, id""")
                .param("group", groupId).query(CardImageRow.class).list();
    }

    /** Đặt ảnh của một thẻ (gắn ảnh hàng loạt, BR-NT-09). */
    public void setCardImage(UUID cardId, String image, Instant now) {
        jdbc.sql("UPDATE vocab_cards SET image_url = :image, updated_at = :now WHERE id = :card")
                .param("image", image).param("now", Timestamp.from(now)).param("card", cardId).update();
    }

    public void softDeleteCard(UUID cardId, Instant now) {
        jdbc.sql("UPDATE vocab_cards SET deleted_at = :now WHERE id = :card AND deleted_at IS NULL")
                .param("now", Timestamp.from(now)).param("card", cardId).update();
    }

    /** Làm mới thời điểm cập nhật của bộ khi nhóm thẻ hoặc thẻ đổi (BR-NT-06, BR-BT-12). */
    public void touchDeck(UUID deckId, Instant now) {
        jdbc.sql("UPDATE vocab_decks SET updated_at = :now WHERE id = :deck")
                .param("now", Timestamp.from(now)).param("deck", deckId).update();
    }
}
