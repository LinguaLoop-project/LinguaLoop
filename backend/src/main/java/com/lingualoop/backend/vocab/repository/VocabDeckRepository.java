package com.lingualoop.backend.vocab.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.vocab.entity.VocabDeck;

/** Đọc bộ hệ thống, các phần và tiến độ của một học viên (UC-VOCAB-03, UC-VOCAB-04). */
@Repository
public interface VocabDeckRepository extends JpaRepository<VocabDeck, UUID> {

    /**
     * Bộ hệ thống đã duyệt (không gồm bộ "Từ đã lưu" và bộ của học viên) kèm số thẻ, số phần và số thẻ của
     * {@code userId} ở từng trạng thái. Truyền {@code slug} để lấy một bộ. Thẻ chưa có dòng tiến độ là Mới; thẻ đến hạn
     * là thẻ đã học có lịch ôn không muộn hơn bây giờ, kể cả thẻ Đã thuộc (BR-VOCAB-09).
     */
    @Query(value = """
            SELECT d.id AS id, d.slug AS slug, d.name AS name, d.name_vi AS nameVi, CAST(d.difficulty AS text) AS cefrLevel,
                   d.is_pro AS pro, count(c.id) AS cardCount, count(DISTINCT g.id) AS groupCount,
                   count(c.id) FILTER (WHERE p.status = 'mastered') AS mastered,
                   count(c.id) FILTER (WHERE p.status = 'reviewing') AS reviewing,
                   count(c.id) FILTER (WHERE p.status = 'learning') AS learning,
                   count(c.id) FILTER (WHERE p.status IS NOT NULL AND p.status <> 'new'
                                         AND p.next_review_at <= now()) AS due
            FROM vocab_decks d
            JOIN vocab_groups g ON g.deck_id = d.id AND g.deleted_at IS NULL
            JOIN vocab_cards c ON c.group_id = g.id AND c.deleted_at IS NULL
            LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :userId
            WHERE d.visibility = 'system' AND d.kind = 'catalog' AND d.status = 'APPROVED' AND d.deleted_at IS NULL
              AND (CAST(:slug AS text) IS NULL OR d.slug = CAST(:slug AS text))
            GROUP BY d.id
            ORDER BY d.sort_order, d.name""", nativeQuery = true)
    List<DeckRow> findDecks(@Param("userId") UUID userId, @Param("slug") String slug);

    /** Các phần của một bộ theo thứ tự, kèm số thẻ và số thẻ {@code userId} đã học (không còn Mới). */
    @Query(value = """
            SELECT g.sort_order AS idx, g.name AS name, g.name_vi AS nameVi, count(c.id) AS cardCount,
                   count(c.id) FILTER (WHERE p.status IS NOT NULL AND p.status <> 'new') AS studiedCount
            FROM vocab_groups g
            LEFT JOIN vocab_cards c ON c.group_id = g.id AND c.deleted_at IS NULL
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
     * của bộ "Từ đã lưu" đến hạn ngay vì bộ đó không có bước học từ mới (BR-VOCAB-09).
     */
    @Query(value = """
            SELECT count(*) FILTER (WHERE p.status = 'mastered') AS mastered,
                   count(*) FILTER (WHERE p.status = 'reviewing') AS reviewing,
                   count(*) FILTER (WHERE p.status = 'learning') AS learning,
                   count(*) FILTER (WHERE (p.status IS NOT NULL AND p.status <> 'new' AND p.next_review_at <= now())
                                       OR (d.kind = 'saved' AND (p.card_id IS NULL OR p.status = 'new'))) AS due
            FROM vocab_cards c
            JOIN vocab_groups g ON g.id = c.group_id AND g.deleted_at IS NULL
            JOIN vocab_decks d ON d.id = g.deck_id AND d.deleted_at IS NULL
                              AND (d.owner_id = :userId OR d.visibility = 'system')
            LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :userId
            WHERE c.deleted_at IS NULL
              AND (p.card_id IS NOT NULL OR (d.kind = 'saved' AND d.owner_id = :userId))""", nativeQuery = true)
    OverviewRow findOverview(@Param("userId") UUID userId);

    interface DeckRow {
        UUID getId();

        String getSlug();

        String getName();

        String getNameVi();

        String getCefrLevel();

        boolean getPro();

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
