package com.lingualoop.backend.lesson.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.lesson.entity.Lesson;

/** Đọc và đổi chủ bài học thư viện chưa xóa khi quản trị viên giao lại nội dung (BR-QT-07). */
public interface LessonOwnershipRepository extends Repository<Lesson, UUID> {

    interface OwnedRow {
        UUID getId();

        String getTitle();

        UUID getOwnerId();

        String getStatus();
    }

    String SELECT = "SELECT l.id AS id, l.title AS title, l.owner_id AS ownerId, l.status AS status FROM lessons l ";

    /** Khóa các dòng để hai quản trị viên giao cùng lúc không chồng lên nhau. */
    @Query(value = SELECT + """
            WHERE l.id IN (:ids) AND l.kind = 'library' AND l.deleted_at IS NULL
            ORDER BY l.id FOR UPDATE""", nativeQuery = true)
    List<OwnedRow> lockLibraryByIds(@Param("ids") Collection<UUID> ids);

    @Query(value = SELECT + """
            WHERE l.owner_id = :ownerId AND l.kind = 'library' AND l.deleted_at IS NULL
            ORDER BY l.id FOR UPDATE""", nativeQuery = true)
    List<OwnedRow> lockLibraryByOwner(@Param("ownerId") UUID ownerId);

    /** Tiêu đề chữ thường của mọi bài chưa xóa của một người (cả bài cá nhân), cùng phạm vi với uq_lessons_owner_title. */
    @Query(value = "SELECT lower(l.title) FROM lessons l WHERE l.owner_id = :ownerId AND l.deleted_at IS NULL",
            nativeQuery = true)
    List<String> activeTitlesLower(@Param("ownerId") UUID ownerId);

    @Modifying(flushAutomatically = true)
    @Query(value = """
            UPDATE lessons SET owner_id = :newOwner
            WHERE id IN (:ids) AND kind = 'library' AND deleted_at IS NULL""", nativeQuery = true)
    int changeOwner(@Param("ids") Collection<UUID> ids, @Param("newOwner") UUID newOwner);
}
