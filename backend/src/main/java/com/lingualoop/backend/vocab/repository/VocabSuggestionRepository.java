package com.lingualoop.backend.vocab.repository;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

/** Các phần của bộ thư viện kèm số thẻ Mới của một học viên, để chọn phần từ mới gợi ý. */
@Repository
@RequiredArgsConstructor
public class VocabSuggestionRepository {

    /**
     * Một phần của bộ thư viện: {@code newCards} là số thẻ học viên chưa học, {@code lastStudied} là lần gần nhất họ chấm
     * một thẻ của phần này (trống nếu chưa học thẻ nào). {@code cefrLevel} là cấp độ của bộ, trống khi chưa gắn
     * (BR-BT-16).
     */
    public record PartCandidate(UUID deckId, String deckName, boolean systemDeck, String cefrLevel, int partNumber,
            String partName, int newCards, Instant lastStudied) {
    }

    private final JdbcClient jdbc;

    /**
     * Phần của bộ thư viện đã xuất bản mà học viên được học (bỏ bộ Pro khi {@code userPro} sai), theo thứ tự bộ hiển thị
     * rồi thứ tự phần. Phần không có thẻ nào bị bỏ.
     */
    public List<PartCandidate> findParts(UUID userId, boolean userPro) {
        return jdbc.sql("""
                SELECT d.id AS deck_id, d.name AS deck_name, (d.owner_id IS NULL) AS system_deck,
                       d.cefr_level AS cefr_level,
                       CAST(row_number() OVER (PARTITION BY d.id ORDER BY g.created_at, g.id) AS int) AS part_number,
                       g.name AS part_name,
                       count(c.id) FILTER (WHERE p.card_id IS NULL) AS new_cards,
                       max(p.updated_at) AS last_studied
                FROM vocab_decks d
                LEFT JOIN deck_categories cat ON cat.id = d.category_id
                JOIN vocab_groups g ON g.deck_id = d.id AND g.deleted_at IS NULL
                JOIN vocab_cards c ON c.group_id = g.id AND c.deleted_at IS NULL
                LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :user
                WHERE d.kind = 'library' AND d.status = 'published' AND d.deleted_at IS NULL
                  AND (NOT d.is_pro OR :userPro)
                GROUP BY d.id, cat.name, g.id
                ORDER BY cat.name NULLS LAST, d.name, d.id, g.created_at, g.id""")
                .param("user", userId).param("userPro", userPro)
                .query((rs, n) -> {
                    Timestamp last = rs.getTimestamp("last_studied");
                    return new PartCandidate(rs.getObject("deck_id", UUID.class), rs.getString("deck_name"),
                            rs.getBoolean("system_deck"), rs.getString("cefr_level"), rs.getInt("part_number"),
                            rs.getString("part_name"), rs.getInt("new_cards"), last == null ? null : last.toInstant());
                })
                .list();
    }
}
