package com.lingualoop.backend.vocab.entity;

import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.common.entity.BaseEntity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Một bộ từ: bộ thư viện ({@code kind = library}, bộ hệ thống khi {@code owner_id} trống), bộ cá nhân ({@code personal})
 * hoặc bộ "Từ đã lưu" của một học viên ({@code saved}). Các màn học viên đọc bộ bằng SQL; entity có để màn soạn bộ dùng.
 * "Đã xóa" là xóa tạm bằng {@code deleted_at}, không phải một giá trị của {@code status} (BR-BT-02).
 */
@Getter
@NoArgsConstructor
@Entity
@Table(name = "vocab_decks")
public class VocabDeck extends BaseEntity {

    public static final String KIND_LIBRARY = "library";
    public static final String STATUS_DRAFT = "draft";
    public static final String STATUS_PUBLISHED = "published";

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private String kind;

    @Column(name = "owner_id")
    private UUID ownerId;

    @Column(name = "category_id")
    private UUID categoryId;

    @Column(name = "image_url")
    private String imageUrl;

    @Column(name = "is_pro", nullable = false)
    private boolean pro;

    @Column(nullable = false)
    private String status;

    @Column(name = "unpublish_reason")
    private String unpublishReason;

    @Column(name = "deleted_at")
    private Instant deletedAt;

    /** Bộ thư viện mới của giáo viên: luôn ở trạng thái Nháp, chưa có nhóm thẻ (BR-BT-02, UC-BT-02). */
    public static VocabDeck newDraft(UUID ownerId, String name, UUID categoryId, String imageUrl, boolean pro) {
        VocabDeck deck = new VocabDeck();
        deck.ownerId = ownerId;
        deck.name = name;
        deck.kind = KIND_LIBRARY;
        deck.categoryId = categoryId;
        deck.imageUrl = imageUrl;
        deck.pro = pro;
        deck.status = STATUS_DRAFT;
        return deck;
    }
}
