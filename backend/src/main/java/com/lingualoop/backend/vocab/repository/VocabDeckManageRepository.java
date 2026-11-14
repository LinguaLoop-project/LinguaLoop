package com.lingualoop.backend.vocab.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.vocab.entity.VocabDeck;

/**
 * Đọc và đổi bộ thư viện trên màn quản lý của giáo viên và quản trị viên (UC-BT-01, BR-BT-01, 10, 12, 14). Sắp bộ
 * cập nhật gần nhất lên đầu, trùng thời điểm thì theo mã bộ; số nhóm và số thẻ chỉ đếm bản ghi chưa xóa (thẻ của nhóm
 * đã xóa cũng không tính). Tìm tên không phân biệt hoa thường với mẫu từ {@link #containsPattern}.
 */
public interface VocabDeckManageRepository extends Repository<VocabDeck, UUID> {

    String SELECT = """
            SELECT d.id AS id, d.name AS name, d.image_url AS imageUrl, d.category_id AS categoryId,
                   cat.name AS categoryName,
                   (SELECT count(*) FROM vocab_groups g WHERE g.deck_id = d.id AND g.deleted_at IS NULL) AS groupCount,
                   (SELECT count(*) FROM vocab_cards c
                      JOIN vocab_groups g ON g.id = c.group_id AND g.deleted_at IS NULL
                     WHERE c.deck_id = d.id AND c.deleted_at IS NULL) AS cardCount,
                   d.is_pro AS pro, d.status AS status, d.updated_at AS updatedAt, d.deleted_at AS deletedAt,
                   d.owner_id AS ownerId, u.display_name AS ownerName, d.unpublish_reason AS unpublishReason
            """;

    String FROM = """
            FROM vocab_decks d
            LEFT JOIN deck_categories cat ON cat.id = d.category_id
            LEFT JOIN users u ON u.id = d.owner_id
            """;

    /** Điều kiện tìm và lọc chung của hai vai trò. */
    String FILTERS = """
              AND (CAST(:pattern AS text) IS NULL OR lower(d.name) LIKE lower(CAST(:pattern AS text)) ESCAPE '\\')
              AND (CAST(:categoryId AS uuid) IS NULL OR d.category_id = CAST(:categoryId AS uuid))
              AND (NOT :other OR d.category_id IS NULL)
              AND (NOT :pro OR d.is_pro)
            """;

    /**
     * Bộ thư viện của chính giáo viên. {@code status}: {@code all} (Nháp và Đã xuất bản), {@code draft},
     * {@code published}, hoặc {@code deleted} (bộ đã xóa không sớm hơn {@code deletedSince}, BR-BT-10).
     */
    String TEACHER_WHERE = """
            WHERE d.owner_id = :ownerId AND d.kind = 'library'
              AND ((:status = 'deleted' AND d.deleted_at >= :deletedSince)
                OR (:status <> 'deleted' AND d.deleted_at IS NULL AND (:status = 'all' OR d.status = :status)))
            """ + FILTERS;

    /** Bộ thư viện Đã xuất bản của mọi giáo viên và bộ hệ thống; không có Nháp, bộ đã xóa, bộ cá nhân. */
    String ADMIN_WHERE = """
            WHERE d.kind = 'library' AND d.status = 'published' AND d.deleted_at IS NULL
              AND (CAST(:ownerId AS uuid) IS NULL OR d.owner_id = CAST(:ownerId AS uuid))
              AND (NOT :system OR d.owner_id IS NULL)
            """ + FILTERS;

    String ORDER = " ORDER BY d.updated_at DESC, d.id DESC LIMIT :limit OFFSET :offset";

    @Query(value = SELECT + FROM + TEACHER_WHERE + ORDER, nativeQuery = true)
    List<DeckManageRow> findTeacherDecks(@Param("ownerId") UUID ownerId, @Param("status") String status,
            @Param("deletedSince") Instant deletedSince, @Param("pattern") String pattern,
            @Param("categoryId") UUID categoryId, @Param("other") boolean other, @Param("pro") boolean pro,
            @Param("limit") int limit, @Param("offset") long offset);

    @Query(value = "SELECT count(*) " + FROM + TEACHER_WHERE, nativeQuery = true)
    long countTeacherDecks(@Param("ownerId") UUID ownerId, @Param("status") String status,
            @Param("deletedSince") Instant deletedSince, @Param("pattern") String pattern,
            @Param("categoryId") UUID categoryId, @Param("other") boolean other, @Param("pro") boolean pro);

    @Query(value = SELECT + FROM + ADMIN_WHERE + ORDER, nativeQuery = true)
    List<DeckManageRow> findAdminDecks(@Param("ownerId") UUID ownerId, @Param("system") boolean system,
            @Param("pattern") String pattern, @Param("categoryId") UUID categoryId, @Param("other") boolean other,
            @Param("pro") boolean pro, @Param("limit") int limit, @Param("offset") long offset);

    @Query(value = "SELECT count(*) " + FROM + ADMIN_WHERE, nativeQuery = true)
    long countAdminDecks(@Param("ownerId") UUID ownerId, @Param("system") boolean system,
            @Param("pattern") String pattern, @Param("categoryId") UUID categoryId, @Param("other") boolean other,
            @Param("pro") boolean pro);

    /** Giáo viên đã có bộ chưa xóa cùng tên, không phân biệt hoa thường (BR-BT-03; cùng điều kiện {@code uq_vocab_decks_name}). */
    @Query(value = """
            SELECT EXISTS (SELECT 1 FROM vocab_decks
                           WHERE owner_id = :ownerId AND lower(name) = lower(:name)
                             AND deleted_at IS NULL AND kind <> 'saved')""", nativeQuery = true)
    boolean existsActiveName(@Param("ownerId") UUID ownerId, @Param("name") String name);

    /**
     * Tên danh mục để kiểm danh mục được chọn còn tồn tại (BR-BT-14). Đọc thẳng {@code deck_categories} vì feature quản
     * lý danh mục chưa có service interface.
     */
    @Query(value = "SELECT name FROM deck_categories WHERE id = :categoryId", nativeQuery = true)
    Optional<String> findCategoryName(@Param("categoryId") UUID categoryId);

    /** Mọi danh mục theo thứ tự hiển thị: thêm trước đứng trước (BR-CD-03, BR-CD-05). */
    @Query(value = "SELECT id AS id, name AS name FROM deck_categories ORDER BY created_at, lower(name)",
            nativeQuery = true)
    List<CategoryRow> findCategories();

    interface CategoryRow {
        UUID getId();

        String getName();
    }

    /**
     * Mẫu LIKE "chứa {@code q}"; {@code %}, {@code _} và {@code \} trong từ khóa là ký tự thường, không phải ký tự đại
     * diện (AC-BT-60). Từ khóa trống hoặc chỉ có khoảng trắng = không lọc ({@code null}).
     */
    static String containsPattern(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        String escaped = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
    }

    /** Một dòng danh sách; {@code ownerId}, {@code ownerName} trống với bộ hệ thống. */
    interface DeckManageRow {
        UUID getId();

        String getName();

        String getImageUrl();

        UUID getCategoryId();

        String getCategoryName();

        long getGroupCount();

        long getCardCount();

        boolean getPro();

        String getStatus();

        Instant getUpdatedAt();

        Instant getDeletedAt();

        UUID getOwnerId();

        String getOwnerName();

        String getUnpublishReason();
    }

    // ------------------------------------------------------------------ một bộ (UC-BT-03 đến UC-BT-08)

    String STATE = """
            SELECT id AS id, owner_id AS ownerId, kind AS kind, status AS status, deleted_at AS deletedAt,
                   name AS name, image_url AS imageUrl
            FROM vocab_decks WHERE id = :id""";

    /** Chủ bộ, loại, trạng thái của một bộ để kiểm quyền trước khi thao tác (BR-BT-01). */
    @Query(value = STATE, nativeQuery = true)
    Optional<DeckStateRow> findState(@Param("id") UUID id);

    /** Như {@link #findState} nhưng khóa dòng tới hết transaction, để hai thao tác đổi trạng thái không chen nhau. */
    @Query(value = STATE + " FOR UPDATE", nativeQuery = true)
    Optional<DeckStateRow> lockState(@Param("id") UUID id);

    /** Thông tin chung của một bộ, cùng cột với dòng danh sách (UC-BT-04). */
    @Query(value = SELECT + FROM + " WHERE d.id = :id", nativeQuery = true)
    Optional<DeckManageRow> findDetail(@Param("id") UUID id);

    /** Nhóm thẻ chưa xóa của bộ theo thứ tự thêm, kèm số thẻ chưa xóa. */
    @Query(value = """
            SELECT g.id AS id, g.name AS name, count(c.id) AS cardCount
            FROM vocab_groups g
            LEFT JOIN vocab_cards c ON c.group_id = g.id AND c.deleted_at IS NULL
            WHERE g.deck_id = :deckId AND g.deleted_at IS NULL
            GROUP BY g.id
            ORDER BY g.created_at, g.id""", nativeQuery = true)
    List<GroupRow> findGroups(@Param("deckId") UUID deckId);

    /** Nhóm chưa xóa thuộc đúng bộ. */
    @Query(value = """
            SELECT EXISTS (SELECT 1 FROM vocab_groups
                           WHERE id = :groupId AND deck_id = :deckId AND deleted_at IS NULL)""", nativeQuery = true)
    boolean existsGroup(@Param("deckId") UUID deckId, @Param("groupId") UUID groupId);

    String CARD_WHERE = """
            FROM vocab_cards c
            WHERE c.group_id = :groupId AND c.deck_id = :deckId AND c.deleted_at IS NULL
              AND (CAST(:pattern AS text) IS NULL OR lower(c.word) LIKE lower(CAST(:pattern AS text)) ESCAPE '\\')
            """;

    /** Thẻ chưa xóa của một nhóm theo thứ tự thêm; tìm theo từ vựng không phân biệt hoa thường (BR-BT-15). */
    @Query(value = """
            SELECT c.id AS id, c.word AS word, c.pos AS pos, c.ipa_uk AS ipaUk, c.ipa_us AS ipaUs,
                   c.meaning_vi AS meaningVi, c.definition_en AS definitionEn, c.definition_vi AS definitionVi,
                   c.example_en AS exampleEn, c.example_vi AS exampleVi, c.image_url AS imageUrl,
                   c.audio_uk_url AS audioUk, c.audio_us_url AS audioUs
            """ + CARD_WHERE + " ORDER BY c.created_at, c.id LIMIT :limit OFFSET :offset", nativeQuery = true)
    List<CardRow> findCards(@Param("deckId") UUID deckId, @Param("groupId") UUID groupId,
            @Param("pattern") String pattern, @Param("limit") int limit, @Param("offset") long offset);

    @Query(value = "SELECT count(*) " + CARD_WHERE, nativeQuery = true)
    long countCards(@Param("deckId") UUID deckId, @Param("groupId") UUID groupId, @Param("pattern") String pattern);

    /** Như {@link #existsActiveName} nhưng bỏ qua chính bộ {@code deckId} (sửa hoặc khôi phục bộ). */
    @Query(value = """
            SELECT EXISTS (SELECT 1 FROM vocab_decks
                           WHERE owner_id = :ownerId AND lower(name) = lower(:name) AND id <> :deckId
                             AND deleted_at IS NULL AND kind <> 'saved')""", nativeQuery = true)
    boolean existsOtherActiveName(@Param("ownerId") UUID ownerId, @Param("name") String name,
            @Param("deckId") UUID deckId);

    /** Lưu thông tin chung của bộ chưa xóa và làm mới ngày cập nhật (UC-BT-03, BR-BT-12). Trả số dòng đổi. */
    @Transactional
    @Modifying
    @Query(value = """
            UPDATE vocab_decks
               SET name = :name, category_id = CAST(:categoryId AS uuid), image_url = CAST(:imageUrl AS text),
                   is_pro = :pro, updated_at = :now
             WHERE id = :id AND deleted_at IS NULL""", nativeQuery = true)
    int updateInfo(@Param("id") UUID id, @Param("name") String name, @Param("categoryId") UUID categoryId,
            @Param("imageUrl") String imageUrl, @Param("pro") boolean pro, @Param("now") Instant now);

    /** Tên các nhóm chưa xóa nhưng chưa có thẻ nào chưa xóa, theo thứ tự thêm (BR-BT-05). */
    @Query(value = """
            SELECT g.name FROM vocab_groups g
            WHERE g.deck_id = :deckId AND g.deleted_at IS NULL
              AND NOT EXISTS (SELECT 1 FROM vocab_cards c WHERE c.group_id = g.id AND c.deleted_at IS NULL)
            ORDER BY g.created_at, g.id""", nativeQuery = true)
    List<String> findEmptyGroupNames(@Param("deckId") UUID deckId);

    @Query(value = "SELECT count(*) FROM vocab_groups WHERE deck_id = :deckId AND deleted_at IS NULL",
            nativeQuery = true)
    long countGroups(@Param("deckId") UUID deckId);

    /**
     * Đổi trạng thái Nháp/Đã xuất bản. Không đổi ngày cập nhật vì đây không phải sửa nội dung (BR-BT-12). Xuất bản xóa
     * lý do gỡ cũ; gỡ xuất bản ghi lý do mới ({@code null} khi giáo viên tự gỡ, BR-BT-08).
     */
    @Transactional
    @Modifying
    @Query(value = "UPDATE vocab_decks SET status = :status, unpublish_reason = CAST(:reason AS text) WHERE id = :id",
            nativeQuery = true)
    int updateStatus(@Param("id") UUID id, @Param("status") String status, @Param("reason") String reason);

    /** Xóa tạm: ghi mốc xóa, giữ trạng thái trước khi xóa (BR-BT-02, 09). */
    @Transactional
    @Modifying
    @Query(value = "UPDATE vocab_decks SET deleted_at = :now WHERE id = :id AND deleted_at IS NULL",
            nativeQuery = true)
    int softDelete(@Param("id") UUID id, @Param("now") Instant now);

    /** Khôi phục về Nháp với {@code name} (tên cũ hoặc tên mới), lên đầu danh sách (BR-BT-10). */
    @Transactional
    @Modifying
    @Query(value = """
            UPDATE vocab_decks SET deleted_at = NULL, status = 'draft', name = :name, updated_at = :now
             WHERE id = :id AND deleted_at IS NOT NULL""", nativeQuery = true)
    int restore(@Param("id") UUID id, @Param("name") String name, @Param("now") Instant now);

    interface DeckStateRow {
        UUID getId();

        UUID getOwnerId();

        String getKind();

        String getStatus();

        Instant getDeletedAt();

        String getName();

        String getImageUrl();
    }

    interface GroupRow {
        UUID getId();

        String getName();

        long getCardCount();
    }

    interface CardRow {
        UUID getId();

        String getWord();

        String getPos();

        String getIpaUk();

        String getIpaUs();

        String getMeaningVi();

        String getDefinitionEn();

        String getDefinitionVi();

        String getExampleEn();

        String getExampleVi();

        String getImageUrl();

        String getAudioUk();

        String getAudioUs();
    }
}
