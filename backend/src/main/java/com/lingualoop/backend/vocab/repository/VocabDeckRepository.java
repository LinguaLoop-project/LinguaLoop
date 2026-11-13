package com.lingualoop.backend.vocab.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.vocab.entity.VocabDeck;

/**
 * Đọc bộ thư viện, các phần và tiến độ của một học viên (UC-HT-01). Trạng thái thẻ suy từ {@code user_card_progress}
 * giống {@code CardSql.STATUS}; viết lại trong từng câu vì {@code @Query} chỉ nhận hằng.
 */
@Repository
public interface VocabDeckRepository extends JpaRepository<VocabDeck, UUID> {

    /**
     * Bộ thư viện đã xuất bản (bộ hệ thống và bộ của giáo viên) kèm số thẻ, số phần và số thẻ của {@code userId} ở từng
     * trạng thái. Truyền {@code deckId} để lấy một bộ. Thẻ đến hạn là thẻ đã học có lịch ôn không muộn hơn bây giờ, kể
     * cả thẻ Đã thuộc, trừ thẻ của bộ Pro khi {@code userPro} sai vì học viên chưa có quyền học bộ đó (BR-HT-13, BR-HT-07).
     */
    @Query(value = """
            SELECT d.id AS id, d.name AS name, d.is_pro AS pro, d.image_url AS thumbnailUrl,
                   cat.id AS categoryId, cat.name AS categoryName,
                   count(c.id) AS cardCount, count(DISTINCT g.id) AS groupCount,
                   count(c.id) FILTER (WHERE p.interval_days >= 21) AS mastered,
                   count(c.id) FILTER (WHERE p.interval_days < 21 AND p.repetitions >= 2) AS reviewing,
                   count(c.id) FILTER (WHERE p.interval_days < 21 AND p.repetitions < 2) AS learning,
                   count(c.id) FILTER (WHERE p.due_at <= now() AND NOT (d.is_pro AND NOT :userPro)) AS due
            FROM vocab_decks d
            JOIN vocab_groups g ON g.deck_id = d.id AND g.deleted_at IS NULL
            JOIN vocab_cards c ON c.group_id = g.id AND c.deleted_at IS NULL
            LEFT JOIN deck_categories cat ON cat.id = d.category_id
            LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :userId
            WHERE d.kind = 'library' AND d.status = 'published' AND d.deleted_at IS NULL
              AND (CAST(:deckId AS uuid) IS NULL OR d.id = CAST(:deckId AS uuid))
            GROUP BY d.id, cat.id
            ORDER BY cat.name NULLS LAST, d.name""", nativeQuery = true)
    List<DeckRow> findDecks(@Param("userId") UUID userId, @Param("deckId") UUID deckId,
            @Param("userPro") boolean userPro);

    /**
     * Các phần (nhóm thẻ) của một bộ theo thứ tự thêm, kèm số thẻ và số thẻ {@code userId} đã học (không còn Mới).
     * {@code idx} là vị trí tính từ 0.
     */
    @Query(value = """
            SELECT CAST(row_number() OVER (ORDER BY g.created_at, g.id) - 1 AS int) AS idx, g.name AS name,
                   count(c.id) AS cardCount, count(p.card_id) AS studiedCount
            FROM vocab_groups g
            LEFT JOIN vocab_cards c ON c.group_id = g.id AND c.deleted_at IS NULL
            LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :userId
            WHERE g.deck_id = :deckId AND g.deleted_at IS NULL
            GROUP BY g.id
            ORDER BY g.created_at, g.id""", nativeQuery = true)
    List<PartRow> findParts(@Param("userId") UUID userId, @Param("deckId") UUID deckId);

    /** Vài thẻ đầu của bộ để xem trước. */
    @Query(value = """
            SELECT c.word AS word, c.pos AS pos, c.meaning_vi AS meaningVi,
                   c.ipa_uk AS ipaUk, c.ipa_us AS ipaUs, c.audio_us_url AS audioUs
            FROM vocab_cards c
            JOIN vocab_groups g ON g.id = c.group_id AND g.deleted_at IS NULL
            WHERE g.deck_id = :deckId AND c.deleted_at IS NULL
            ORDER BY g.created_at, g.id, c.created_at, c.id
            LIMIT :limit""", nativeQuery = true)
    List<SampleRow> findSampleCards(@Param("deckId") UUID deckId, @Param("limit") int limit);

    /**
     * Số thẻ của {@code userId} ở từng trạng thái trên mọi bộ thư viện và bộ của chính họ, kể cả "Từ đã lưu". Thẻ Mới
     * của bộ "Từ đã lưu" đến hạn ngay vì bộ đó không có bước học từ mới (BR-HT-13).
     */
    @Query(value = """
            SELECT count(*) FILTER (WHERE p.interval_days >= 21) AS mastered,
                   count(*) FILTER (WHERE p.interval_days < 21 AND p.repetitions >= 2) AS reviewing,
                   count(*) FILTER (WHERE p.interval_days < 21 AND p.repetitions < 2) AS learning,
                   count(*) FILTER (WHERE ((p.card_id IS NOT NULL AND p.due_at <= now())
                                       OR (d.kind = 'saved' AND p.card_id IS NULL))
                                      AND NOT (d.is_pro AND NOT :userPro)) AS due
            FROM vocab_cards c
            JOIN vocab_groups g ON g.id = c.group_id AND g.deleted_at IS NULL
            JOIN vocab_decks d ON d.id = g.deck_id AND d.deleted_at IS NULL
                              AND ((d.kind = 'library' AND d.status = 'published') OR d.owner_id = :userId)
            LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :userId
            WHERE c.deleted_at IS NULL
              AND (p.card_id IS NOT NULL OR (d.kind = 'saved' AND d.owner_id = :userId))""", nativeQuery = true)
    OverviewRow findOverview(@Param("userId") UUID userId, @Param("userPro") boolean userPro);

    interface DeckRow {
        UUID getId();

        String getName();

        boolean getPro();

        String getThumbnailUrl();

        UUID getCategoryId();

        String getCategoryName();

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

        long getCardCount();

        long getStudiedCount();
    }

    interface SampleRow {
        String getWord();

        String getPos();

        String getMeaningVi();

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
