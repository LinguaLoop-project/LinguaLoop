package com.lingualoop.backend.lesson.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.lesson.entity.Lesson;

/**
 * Đọc bài thư viện trên màn quản lý của giáo viên và quản trị viên (UC-BH-01, UC-BH-02, BR-BH-01, 02, 05, 16). Sắp bài
 * cập nhật gần nhất lên đầu, trùng thời điểm thì theo mã bài; số câu chỉ đếm câu chưa xóa. Tìm tiêu đề không phân biệt
 * hoa thường với mẫu từ {@link #containsPattern}.
 */
public interface LessonManageRepository extends Repository<Lesson, UUID> {

    String SELECT = """
            SELECT l.id AS id, l.title AS title, l.youtube_id AS youtubeId, l.duration_sec AS durationSec,
                   l.topic_id AS topicId, t.name AS topicName, l.cefr_level AS cefrLevel, l.is_pro AS pro,
                   l.status AS status, l.unpublish_reason AS unpublishReason,
                   (SELECT count(*) FROM sentences s WHERE s.lesson_id = l.id AND s.deleted_at IS NULL) AS sentenceCount,
                   l.created_at AS createdAt, l.updated_at AS updatedAt, l.deleted_at AS deletedAt,
                   l.owner_id AS ownerId, u.display_name AS ownerName,
                   l.first_published_at IS NOT NULL AS everPublished
            """;

    String FROM = """
            FROM lessons l
            LEFT JOIN topics t ON t.id = l.topic_id
            LEFT JOIN users u ON u.id = l.owner_id
            """;

    /** Tìm và lọc chung của hai vai trò (UC-BH-01 Bước 5). */
    String FILTERS = """
              AND (CAST(:pattern AS text) IS NULL OR lower(l.title) LIKE lower(CAST(:pattern AS text)) ESCAPE '\\')
              AND (CAST(:topicId AS uuid) IS NULL OR l.topic_id = CAST(:topicId AS uuid))
              AND (CAST(:cefrLevel AS text) IS NULL OR l.cefr_level = CAST(:cefrLevel AS text))
              AND (NOT :pro OR l.is_pro)
            """;

    /**
     * Bài thư viện của chính giáo viên. {@code status}: {@code all} (Nháp và Đã xuất bản), {@code draft},
     * {@code published}, hoặc {@code deleted} (bài xóa không sớm hơn {@code deletedSince}, BR-BH-05).
     */
    String TEACHER_WHERE = """
            WHERE l.owner_id = :ownerId AND l.kind = 'library'
              AND ((:status = 'deleted' AND l.deleted_at >= :deletedSince)
                OR (:status <> 'deleted' AND l.deleted_at IS NULL AND (:status = 'all' OR l.status = :status)))
            """ + FILTERS;

    /** Bài thư viện Đã xuất bản của mọi giáo viên; không có Nháp, bài đã xóa, bài cá nhân (BR-BH-02). */
    String ADMIN_WHERE = """
            WHERE l.kind = 'library' AND l.status = 'published' AND l.deleted_at IS NULL
              AND (CAST(:ownerId AS uuid) IS NULL OR l.owner_id = CAST(:ownerId AS uuid))
            """ + FILTERS;

    String ORDER = " ORDER BY l.updated_at DESC, l.id DESC LIMIT :limit OFFSET :offset";

    @Query(value = SELECT + FROM + TEACHER_WHERE + ORDER, nativeQuery = true)
    List<LessonManageRow> findTeacherLessons(@Param("ownerId") UUID ownerId, @Param("status") String status,
            @Param("deletedSince") Instant deletedSince, @Param("pattern") String pattern,
            @Param("topicId") UUID topicId, @Param("cefrLevel") String cefrLevel, @Param("pro") boolean pro,
            @Param("limit") int limit, @Param("offset") long offset);

    @Query(value = "SELECT count(*) " + FROM + TEACHER_WHERE, nativeQuery = true)
    long countTeacherLessons(@Param("ownerId") UUID ownerId, @Param("status") String status,
            @Param("deletedSince") Instant deletedSince, @Param("pattern") String pattern,
            @Param("topicId") UUID topicId, @Param("cefrLevel") String cefrLevel, @Param("pro") boolean pro);

    @Query(value = SELECT + FROM + ADMIN_WHERE + ORDER, nativeQuery = true)
    List<LessonManageRow> findAdminLessons(@Param("ownerId") UUID ownerId, @Param("pattern") String pattern,
            @Param("topicId") UUID topicId, @Param("cefrLevel") String cefrLevel, @Param("pro") boolean pro,
            @Param("limit") int limit, @Param("offset") long offset);

    @Query(value = "SELECT count(*) " + FROM + ADMIN_WHERE, nativeQuery = true)
    long countAdminLessons(@Param("ownerId") UUID ownerId, @Param("pattern") String pattern,
            @Param("topicId") UUID topicId, @Param("cefrLevel") String cefrLevel, @Param("pro") boolean pro);

    /** Thông tin một bài, cùng cột với dòng danh sách (UC-BH-02). */
    @Query(value = SELECT + FROM + " WHERE l.id = :id", nativeQuery = true)
    Optional<LessonManageRow> findDetail(@Param("id") UUID id);

    /**
     * Mẫu LIKE "chứa {@code q}"; {@code %}, {@code _} và {@code \} trong từ khóa là ký tự thường. Từ khóa trống = không
     * lọc ({@code null}).
     */
    static String containsPattern(String q) {
        if (q == null || q.isBlank()) {
            return null;
        }
        String escaped = q.strip().replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
        return "%" + escaped + "%";
    }

    /** Một dòng danh sách hoặc phần đầu của chi tiết bài. */
    interface LessonManageRow {
        UUID getId();

        String getTitle();

        String getYoutubeId();

        int getDurationSec();

        UUID getTopicId();

        String getTopicName();

        String getCefrLevel();

        boolean getPro();

        String getStatus();

        String getUnpublishReason();

        boolean getEverPublished();

        long getSentenceCount();

        Instant getCreatedAt();

        Instant getUpdatedAt();

        Instant getDeletedAt();

        UUID getOwnerId();

        String getOwnerName();
    }
}
