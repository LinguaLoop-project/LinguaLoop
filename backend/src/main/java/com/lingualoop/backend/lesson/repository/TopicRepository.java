package com.lingualoop.backend.lesson.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.lesson.dto.projection.AdminTopicRow;
import com.lingualoop.backend.lesson.entity.Topic;

@Repository
public interface TopicRepository extends JpaRepository<Topic, UUID> {

    List<Topic> findAllByOrderByNameAsc();

    /**
     * Danh sách chủ đề của quản trị viên (UC-CD-01) trong một truy vấn: LEFT JOIN bài học thư viện đã xuất bản, chưa
     * xóa rồi đếm theo chủ đề, nên không phát sinh truy vấn đếm riêng cho từng chủ đề (N+1). Sắp theo thứ tự hiển
     * thị (BR-CD-05). {@code pattern} là mẫu chữ thường từ {@code LikePatterns}, {@code "%"} khi không tìm.
     * {@code anyVisibility = false} thì chỉ giữ chủ đề có trạng thái hiển thị bằng {@code visible} (BR-CD-04).
     */
    @Query("""
            SELECT new com.lingualoop.backend.lesson.dto.projection.AdminTopicRow(t.id, t.name, COUNT(l.id), t.updatedAt)
            FROM Topic t
            LEFT JOIN Lesson l ON l.topic = t AND l.kind = 'library'
                 AND l.status = com.lingualoop.backend.lesson.enums.LessonStatus.PUBLISHED AND l.deletedAt IS NULL
            WHERE lower(t.name) LIKE :pattern
            GROUP BY t.id, t.name, t.updatedAt, t.createdAt
            HAVING :anyVisibility = true
                OR (:visible = true AND COUNT(l.id) > 0)
                OR (:visible = false AND COUNT(l.id) = 0)
            ORDER BY t.createdAt, lower(t.name)""")
    List<AdminTopicRow> findAdminRows(@Param("pattern") String pattern, @Param("anyVisibility") boolean anyVisibility,
            @Param("visible") boolean visible);

    /** Một dòng như {@link #findAdminRows} để trả về sau khi thêm hoặc sửa tên. */
    @Query("""
            SELECT new com.lingualoop.backend.lesson.dto.projection.AdminTopicRow(t.id, t.name, COUNT(l.id), t.updatedAt)
            FROM Topic t
            LEFT JOIN Lesson l ON l.topic = t AND l.kind = 'library'
                 AND l.status = com.lingualoop.backend.lesson.enums.LessonStatus.PUBLISHED AND l.deletedAt IS NULL
            WHERE t.id = :id
            GROUP BY t.id, t.name, t.updatedAt""")
    Optional<AdminTopicRow> findAdminRow(@Param("id") UUID id);

    /** Tên đã dùng, không phân biệt hoa thường (BR-CD-01, khớp chỉ mục {@code uq_topics_name}). */
    boolean existsByNameIgnoreCase(String name);

    /** Tên đã dùng bởi chủ đề khác khi sửa tên (BR-CD-01). */
    boolean existsByNameIgnoreCaseAndIdNot(String name, UUID id);
}
