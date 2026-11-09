package com.lingualoop.backend.vocab.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.vocab.entity.UserSavedWord;

/**
 * Từ đã lưu và bộ "Từ đã lưu" của học viên. Bộ, phần và thẻ chỉ ghi bằng SQL vì lát này chưa cần đọc chúng thành
 * entity; các lát sau (danh sách bộ, học, ôn) sẽ thêm entity cho chúng.
 */
@Repository
public interface SavedWordRepository extends JpaRepository<UserSavedWord, UUID> {

    Optional<UserSavedWord> findByUserIdAndWordIdAndMeaningNo(UUID userId, UUID wordId, Integer meaningNo);

    Optional<UserSavedWord> findByIdAndUserId(UUID id, UUID userId);

    @Query(value = "SELECT id FROM vocab_decks WHERE owner_id = :userId AND kind = 'saved'", nativeQuery = true)
    Optional<UUID> findSavedDeckId(@Param("userId") UUID userId);

    /** Tạo bộ "Từ đã lưu"; hai yêu cầu cùng tạo thì một bên vi phạm ràng buộc duy nhất và được thử lại. */
    @Query(value = """
            INSERT INTO vocab_decks (owner_id, kind, name, name_vi, visibility, status)
            VALUES (:userId, 'saved', 'Saved words', 'Từ đã lưu', 'private', 'APPROVED')
            RETURNING id""", nativeQuery = true)
    UUID insertSavedDeck(@Param("userId") UUID userId);

    @Query(value = """
            SELECT id FROM vocab_groups WHERE deck_id = :deckId AND deleted_at IS NULL ORDER BY sort_order LIMIT 1""",
            nativeQuery = true)
    Optional<UUID> findFirstGroupId(@Param("deckId") UUID deckId);

    @Query(value = """
            INSERT INTO vocab_groups (deck_id, name, name_vi, sort_order)
            VALUES (:deckId, 'Saved words', 'Từ đã lưu', 0)
            RETURNING id""", nativeQuery = true)
    UUID insertGroup(@Param("deckId") UUID deckId);

    /**
     * Tạo thẻ cho một nghĩa, hoặc khôi phục thẻ đã ẩn khi bỏ lưu (giữ nguyên nội dung cũ, ADR 0009; câu gốc mới thay
     * câu cũ nếu có). {@code sort_order} lấy lớn hơn mọi thẻ của phần, kể cả thẻ đã ẩn, nên không bao giờ trùng.
     */
    @Query(value = """
            INSERT INTO vocab_cards (group_id, word_id, meaning_no, word, pos, translation_vi, example_en, example_vi,
                                     context_en, context_vi, difficulty, sort_order)
            VALUES (:groupId, :wordId, :meaningNo, :word, :pos, :translationVi, :exampleEn, :exampleVi,
                    :contextEn, :contextVi, CAST(:difficulty AS cefr_code),
                    (SELECT coalesce(max(sort_order), -1) + 1 FROM vocab_cards WHERE group_id = :groupId))
            ON CONFLICT (group_id, word_id, meaning_no) WHERE word_id IS NOT NULL AND meaning_no IS NOT NULL
            DO UPDATE SET deleted_at = NULL,
                          context_en = coalesce(EXCLUDED.context_en, vocab_cards.context_en),
                          context_vi = coalesce(EXCLUDED.context_vi, vocab_cards.context_vi)
            RETURNING id""", nativeQuery = true)
    UUID upsertCard(@Param("groupId") UUID groupId, @Param("wordId") UUID wordId, @Param("meaningNo") int meaningNo,
            @Param("word") String word, @Param("pos") String pos, @Param("translationVi") String translationVi,
            @Param("exampleEn") String exampleEn, @Param("exampleVi") String exampleVi,
            @Param("contextEn") String contextEn, @Param("contextVi") String contextVi,
            @Param("difficulty") String difficulty);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO vocab_card_phonetics (card_id, accent, ipa, audio_url)
            VALUES (:cardId, :accent, :ipa, :audioUrl)
            ON CONFLICT (card_id, accent) DO NOTHING""", nativeQuery = true)
    int insertPhonetic(@Param("cardId") UUID cardId, @Param("accent") String accent, @Param("ipa") String ipa,
            @Param("audioUrl") String audioUrl);

    /** Ẩn thẻ khi bỏ lưu; tiến độ và nhật ký của thẻ được giữ để lưu lại thì khôi phục (BR-HT-04). */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = "UPDATE vocab_cards SET deleted_at = now() WHERE id = :cardId AND deleted_at IS NULL",
            nativeQuery = true)
    int hideCard(@Param("cardId") UUID cardId);

    /**
     * Từ đã lưu kèm nội dung thẻ, trạng thái và bài nguồn, mới lưu trước. Truyền {@code savedWordId} để lấy một dòng.
     * Thẻ chưa có dòng tiến độ là Mới. Bài đã ẩn hoặc đã xoá thì không còn liên kết.
     */
    @Query(value = """
            SELECT s.id AS id, c.word AS headword, CAST(c.difficulty AS text) AS cefrLevel, c.pos AS pos,
                   s.meaning_no AS meaningNo, c.translation_vi AS translationVi, c.example_en AS exampleEn,
                   c.example_vi AS exampleVi, pk.ipa AS ipaUk, pu.ipa AS ipaUs, pk.audio_url AS audioUk,
                   pu.audio_url AS audioUs, s.source AS source, s.sentence_id AS sentenceId,
                   l.slug AS lessonSlug, l.title AS lessonTitle, c.context_en AS contextEn, c.context_vi AS contextVi,
                   coalesce(p.status, 'new') AS status, p.next_review_at AS nextReviewAt, s.created_at AS savedAt
            FROM user_saved_words s
            JOIN vocab_cards c ON c.id = s.card_id AND c.deleted_at IS NULL
            LEFT JOIN vocab_card_phonetics pu ON pu.card_id = c.id AND pu.accent = 'us'
            LEFT JOIN vocab_card_phonetics pk ON pk.card_id = c.id AND pk.accent = 'uk'
            LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = s.user_id
            LEFT JOIN sentences se ON se.id = s.sentence_id
            LEFT JOIN lessons l ON l.id = se.lesson_id AND l.deleted_at IS NULL AND l.status = 'APPROVED'
            WHERE s.user_id = :userId
              AND (CAST(:savedWordId AS uuid) IS NULL OR s.id = CAST(:savedWordId AS uuid))
            ORDER BY s.created_at DESC, s.id""", nativeQuery = true)
    List<SavedWordRow> findRows(@Param("userId") UUID userId, @Param("savedWordId") UUID savedWordId);

    interface SavedWordRow {
        UUID getId();

        String getHeadword();

        String getCefrLevel();

        String getPos();

        Integer getMeaningNo();

        String getTranslationVi();

        String getExampleEn();

        String getExampleVi();

        String getIpaUk();

        String getIpaUs();

        String getAudioUk();

        String getAudioUs();

        String getSource();

        UUID getSentenceId();

        String getLessonSlug();

        String getLessonTitle();

        String getContextEn();

        String getContextVi();

        String getStatus();

        Instant getNextReviewAt();

        Instant getSavedAt();
    }
}
