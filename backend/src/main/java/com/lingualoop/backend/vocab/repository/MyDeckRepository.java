package com.lingualoop.backend.vocab.repository;

import java.sql.Timestamp;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.vocab.dto.MyDeckView;

import lombok.RequiredArgsConstructor;

/** Bộ từ cá nhân ({@code kind = 'personal'}) của một học viên: "Bộ của tôi" (UC-HT-08). */
@Repository
@RequiredArgsConstructor
public class MyDeckRepository {

    private static final String SELECT = """
            SELECT d.id, d.name, d.created_at,
                   count(c.id) AS card_count,
                   count(c.id) FILTER (WHERE p.card_id IS NOT NULL AND p.due_at <= now()) AS due_count
            FROM vocab_decks d
            LEFT JOIN vocab_cards c ON c.deck_id = d.id AND c.deleted_at IS NULL
            LEFT JOIN user_card_progress p ON p.card_id = c.id AND p.user_id = :user
            WHERE d.owner_id = :user AND d.kind = 'personal' AND d.deleted_at IS NULL
            """;

    private final JdbcClient jdbc;

    /** Mọi bộ cá nhân chưa xóa của học viên, mới tạo trước. */
    public List<MyDeckView> findAll(UUID userId) {
        return jdbc.sql(SELECT + " GROUP BY d.id ORDER BY d.created_at DESC, d.id")
                .param("user", userId)
                .query((rs, n) -> view(rs))
                .list();
    }

    /** Một bộ cá nhân chưa xóa; trống nếu bộ không có, đã xóa, của người khác hoặc không phải bộ cá nhân. */
    public Optional<MyDeckView> findOne(UUID userId, UUID deckId) {
        return jdbc.sql(SELECT + " AND d.id = :deck GROUP BY d.id")
                .param("user", userId).param("deck", deckId)
                .query((rs, n) -> view(rs))
                .optional();
    }

    /**
     * Có bộ cá nhân nào khác chưa xóa của học viên trùng tên không (không phân biệt hoa thường, BR-HT-25).
     * {@code exceptId} là bộ đang đổi tên, trống khi thêm bộ mới.
     */
    public boolean existsName(UUID userId, String name, UUID exceptId) {
        return Boolean.TRUE.equals(jdbc.sql("""
                SELECT EXISTS (SELECT 1 FROM vocab_decks
                               WHERE owner_id = :user AND kind <> 'saved' AND deleted_at IS NULL
                                 AND lower(name) = lower(:name)
                                 AND (CAST(:except AS uuid) IS NULL OR id <> CAST(:except AS uuid)))""")
                .param("user", userId).param("name", name).param("except", exceptId)
                .query(Boolean.class).single());
    }

    public UUID insert(UUID userId, String name) {
        return jdbc.sql("""
                INSERT INTO vocab_decks (owner_id, kind, name) VALUES (:user, 'personal', :name) RETURNING id""")
                .param("user", userId).param("name", name)
                .query(UUID.class).single();
    }

    /** Đổi tên bộ cá nhân chưa xóa; trả số dòng đổi (0 khi không có bộ nào khớp). */
    public int rename(UUID userId, UUID deckId, String name) {
        return jdbc.sql("""
                UPDATE vocab_decks SET name = :name, updated_at = now()
                WHERE id = :deck AND owner_id = :user AND kind = 'personal' AND deleted_at IS NULL""")
                .param("user", userId).param("deck", deckId).param("name", name)
                .update();
    }

    /** Xóa tạm bộ cá nhân (đặt {@code deleted_at}); thẻ và tiến độ giữ nguyên nhưng bộ không còn được học hay ôn. */
    public int softDelete(UUID userId, UUID deckId) {
        return jdbc.sql("""
                UPDATE vocab_decks SET deleted_at = now(), updated_at = now()
                WHERE id = :deck AND owner_id = :user AND kind = 'personal' AND deleted_at IS NULL""")
                .param("user", userId).param("deck", deckId)
                .update();
    }

    private static MyDeckView view(java.sql.ResultSet rs) throws java.sql.SQLException {
        Timestamp created = rs.getTimestamp("created_at");
        return new MyDeckView(rs.getObject("id", UUID.class), rs.getString("name"), rs.getInt("card_count"),
                rs.getInt("due_count"), created == null ? null : created.toInstant());
    }
}
