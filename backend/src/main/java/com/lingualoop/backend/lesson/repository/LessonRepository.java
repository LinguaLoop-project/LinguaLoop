package com.lingualoop.backend.lesson.repository;

import com.lingualoop.backend.lesson.entity.Lesson;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, UUID>, JpaSpecificationExecutor<Lesson> {

    Optional<Lesson> findBySlugAndDeletedAtIsNull(String slug);

    @Query("SELECT l FROM Lesson l WHERE l.topic.slug = :topicSlug AND l.status = 'APPROVED' AND l.deletedAt IS NULL ORDER BY l.viewCount DESC")
    List<Lesson> findTopPopularByTopicSlug(@Param("topicSlug") String topicSlug, Pageable pageable);

    @Query(value = "SELECT sentence_count FROM v_lesson_sentence_counts WHERE lesson_id = :lessonId", nativeQuery = true)
    Long getSentenceCount(@Param("lessonId") UUID lessonId);

    long countByTopicIdAndStatusAndDeletedAtIsNull(UUID topicId, com.lingualoop.backend.lesson.enums.LessonStatus status);

    @Query("SELECT l FROM Lesson l JOIN UserLessonProgress ulp ON l.id = ulp.lessonId WHERE ulp.userId = :userId AND ulp.completedAt IS NULL AND l.status = 'APPROVED' AND l.deletedAt IS NULL ORDER BY ulp.lastActivityAt DESC")
    List<Lesson> findContinueLessons(@Param("userId") UUID userId, Pageable pageable);

    @Query("SELECT l FROM Lesson l WHERE l.topic.id = :topicId AND l.id != :excludeLessonId AND l.status = 'APPROVED' AND l.deletedAt IS NULL ORDER BY l.viewCount DESC")
    List<Lesson> findRelatedLessons(@Param("topicId") UUID topicId, @Param("excludeLessonId") UUID excludeLessonId, Pageable pageable);
}
