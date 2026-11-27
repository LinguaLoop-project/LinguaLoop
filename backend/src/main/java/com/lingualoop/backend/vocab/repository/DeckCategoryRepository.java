package com.lingualoop.backend.vocab.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.vocab.dto.projection.AdminCategoryRow;
import com.lingualoop.backend.vocab.entity.DeckCategory;

@Repository
public interface DeckCategoryRepository extends JpaRepository<DeckCategory, UUID> {

    /**
     * Danh sách danh mục của quản trị viên (UC-CD-04) trong một truy vấn: LEFT JOIN bộ thư viện đã xuất bản, chưa xóa
     * rồi đếm theo danh mục, nên không phát sinh truy vấn đếm riêng cho từng danh mục (N+1). Sắp theo thứ tự hiển thị
     * (BR-CD-05). {@code pattern} là mẫu chữ thường từ {@code LikePatterns}, {@code "%"} khi không tìm.
     */
    @Query("""
            SELECT new com.lingualoop.backend.vocab.dto.projection.AdminCategoryRow(c.id, c.name, COUNT(d.id), c.updatedAt)
            FROM DeckCategory c
            LEFT JOIN VocabDeck d ON d.categoryId = c.id AND d.kind = 'library' AND d.status = 'published'
                 AND d.deletedAt IS NULL
            WHERE lower(c.name) LIKE :pattern
            GROUP BY c.id, c.name, c.updatedAt, c.createdAt
            ORDER BY c.createdAt, lower(c.name)""")
    List<AdminCategoryRow> findAdminRows(@Param("pattern") String pattern);

    /** Một dòng như {@link #findAdminRows} để trả về sau khi thêm hoặc sửa tên. */
    @Query("""
            SELECT new com.lingualoop.backend.vocab.dto.projection.AdminCategoryRow(c.id, c.name, COUNT(d.id), c.updatedAt)
            FROM DeckCategory c
            LEFT JOIN VocabDeck d ON d.categoryId = c.id AND d.kind = 'library' AND d.status = 'published'
                 AND d.deletedAt IS NULL
            WHERE c.id = :id
            GROUP BY c.id, c.name, c.updatedAt""")
    Optional<AdminCategoryRow> findAdminRow(@Param("id") UUID id);

    /** Tên đã dùng, không phân biệt hoa thường (BR-CD-02, khớp chỉ mục {@code uq_deck_categories_name}). */
    boolean existsByNameIgnoreCase(String name);

    /** Tên đã dùng bởi danh mục khác khi sửa tên (BR-CD-02). */
    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
}
