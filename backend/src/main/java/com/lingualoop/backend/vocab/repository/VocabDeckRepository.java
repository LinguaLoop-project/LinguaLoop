package com.lingualoop.backend.vocab.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.vocab.entity.VocabDeck;

/** Đọc bộ hệ thống, các phần và tiến độ của một học viên (UC-HT-01). */
@Repository
public interface VocabDeckRepository extends JpaRepository<VocabDeck, UUID> {

    /**
     * Bộ hệ thống đã duyệt (không gồm bộ "Từ đã lưu" và bộ của học viên) kèm số thẻ, số phần và số thẻ của
     * {@code userId} ở từng trạng thái. Truyền {@code slug} để lấy một bộ. Thẻ chưa có dòng tiến độ là Mới; thẻ đến hạn
     * là thẻ đã học có lịch ôn không muộn hơn bây giờ, kể cả thẻ Đã thuộc, trừ thẻ ở phần bị khoá với {@code userPro} sai
     * (bộ Pro, từ phần thứ ba) vì học viên chưa có quyền học bộ đó (BR-HT-13).
     */
    @Query(value = """
            WITH part_index AS (
                SELECT id, row_number() OVER (PARTITION BY deck_id ORDER BY sort_order) - 1 AS idx
                FROM vocab_groups g WHERE g.deleted_at IS NULL
                  AND EXISTS (SELECT 1 FROM vocab_cards c WHERE c.group_id = g.id AND c.deleted_at IS NULL))
            SELECT d.id AS id, d.slug AS slug, d.name AS name, d.name_vi AS nameVi, CAST(d.difficulty AS text) AS cefrLevel,
                   d.is_pro AS pro, d.thumbnail_url AS thumbnailUrl, cat.slug AS categorySlug, cat.name_en AS categoryName, cat.name_vi AS categoryNameVi,
                   count(c.id) AS cardCount, count(DISTINCT g.id) AS groupCount,
                   count(c.id) FILTER (WHERE p.status = 'mastered') AS mastered,
                   count(c.id) FILTER (WHERE p.status = 'reviewing') AS reviewing,
                   count(c.id) FILTER (WHERE p.status = 'learning') AS learning,
                   count(c.id) FILTER (WHERE p.status IS NOT NULL AND p.status <> 'new'
                                         AND p.next_review_at <= now()
                                         AND NOT (d.is_pro AND NOT :userPro AND pi.idx >= 2)) AS due
            FROM vocab_decks d
            JOIN vocab_groups g ON g.deck_id = d.id AND g.deleted_at IS NULL
            JOIN part_index pi ON pi.id = g.id
            JOIN vocab_cards c ON c.group_id = g.id AND c.deleted_at IS NULL
            LEFT JOIN vocab_deck_categories cat ON cat.id = d.category_id
            LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :userId
            WHERE d.visibility = 'system' AND d.kind = 'catalog' AND d.status = 'APPROVED' AND d.deleted_at IS NULL
              AND (CAST(:slug AS text) IS NULL OR d.slug = CAST(:slug AS text))
            GROUP BY d.id, cat.id
            ORDER BY cat.sort_order NULLS LAST, cat.name_en, d.sort_order, d.name""", nativeQuery = true)
    List<DeckRow> findDecks(@Param("userId") UUID userId, @Param("slug") String slug, @Param("userPro") boolean userPro);

    /**
     * Các phần (nhóm thẻ) của một bộ theo thứ tự, kèm số thẻ và số thẻ {@code userId} đã học (không còn Mới). Nhóm không
     * có thẻ nào bị ẩn khỏi học viên (BR-NT-05).
     * {@code idx} là vị trí tính từ 0, không phải {@code sort_order} (seed đánh số từ 1 và có thể thủng).
     */
    @Query(value = """
            SELECT CAST(row_number() OVER (ORDER BY g.sort_order) - 1 AS int) AS idx, g.name AS name, g.name_vi AS nameVi, count(c.id) AS cardCount,
                   count(c.id) FILTER (WHERE p.status IS NOT NULL AND p.status <> 'new') AS studiedCount
            FROM vocab_groups g
            JOIN vocab_cards c ON c.group_id = g.id AND c.deleted_at IS NULL
            LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :userId
            WHERE g.deck_id = :deckId AND g.deleted_at IS NULL
            GROUP BY g.id
            ORDER BY g.sort_order""", nativeQuery = true)
    List<PartRow> findParts(@Param("userId") UUID userId, @Param("deckId") UUID deckId);

    /** Vài thẻ đầu của bộ để xem trước. */
    @Query(value = """
            SELECT c.word AS word, c.pos AS pos, c.translation_vi AS translationVi,
                   pk.ipa AS ipaUk, pu.ipa AS ipaUs, pu.audio_url AS audioUs
            FROM vocab_cards c
            JOIN vocab_groups g ON g.id = c.group_id AND g.deleted_at IS NULL
            LEFT JOIN vocab_card_phonetics pu ON pu.card_id = c.id AND pu.accent = 'us'
            LEFT JOIN vocab_card_phonetics pk ON pk.card_id = c.id AND pk.accent = 'uk'
            WHERE g.deck_id = :deckId AND c.deleted_at IS NULL
            ORDER BY g.sort_order, c.sort_order
            LIMIT :limit""", nativeQuery = true)
    List<SampleRow> findSampleCards(@Param("deckId") UUID deckId, @Param("limit") int limit);

    /**
     * Số thẻ của {@code userId} ở từng trạng thái trên mọi bộ hệ thống và bộ của chính họ, kể cả "Từ đã lưu". Thẻ Mới
     * của bộ "Từ đã lưu" đến hạn ngay vì bộ đó không có bước học từ mới (BR-HT-13).
     */
    @Query(value = """
            WITH part_index AS (
                SELECT id, row_number() OVER (PARTITION BY deck_id ORDER BY sort_order) - 1 AS idx
                FROM vocab_groups g WHERE g.deleted_at IS NULL
                  AND EXISTS (SELECT 1 FROM vocab_cards c WHERE c.group_id = g.id AND c.deleted_at IS NULL))
            SELECT count(*) FILTER (WHERE p.status = 'mastered') AS mastered,
                   count(*) FILTER (WHERE p.status = 'reviewing') AS reviewing,
                   count(*) FILTER (WHERE p.status = 'learning') AS learning,
                   count(*) FILTER (WHERE ((p.status IS NOT NULL AND p.status <> 'new' AND p.next_review_at <= now())
                                       OR (d.kind = 'saved' AND (p.card_id IS NULL OR p.status = 'new')))
                                      AND NOT (d.is_pro AND NOT :userPro AND pi.idx >= 2)) AS due
            FROM vocab_cards c
            JOIN vocab_groups g ON g.id = c.group_id AND g.deleted_at IS NULL
            JOIN part_index pi ON pi.id = g.id
            JOIN vocab_decks d ON d.id = g.deck_id AND d.deleted_at IS NULL
                              AND (d.owner_id = :userId OR d.visibility = 'system')
            LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :userId
            WHERE c.deleted_at IS NULL
              AND (p.card_id IS NOT NULL OR (d.kind = 'saved' AND d.owner_id = :userId))""", nativeQuery = true)
    OverviewRow findOverview(@Param("userId") UUID userId, @Param("userPro") boolean userPro);

    interface DeckRow {
        UUID getId();

        String getSlug();

        String getName();

        String getNameVi();

        String getCefrLevel();

        boolean getPro();

        String getThumbnailUrl();

        String getCategorySlug();

        String getCategoryName();

        String getCategoryNameVi();

        long getCardCount();

        long getGroupCount();

        long getMastered();

        long getReviewing();

        long getLearning();

        long getDue();
    }

    interface PartRow {
        int getIdx();

        String getName();

        String getNameVi();

        long getCardCount();

        long getStudiedCount();
    }

    interface SampleRow {
        String getWord();

        String getPos();

        String getTranslationVi();

        String getIpaUk();

        String getIpaUs();

        String getAudioUs();
    }

    interface OverviewRow {
        long getMastered();

        long getReviewing();

        long getLearning();

        long getDue();
    }
}
