package com.lingualoop.backend.lesson.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.enums.LessonStatus;

@Repository
public interface LessonRepository extends JpaRepository<Lesson, UUID>, JpaSpecificationExecutor<Lesson> {

    /** Số bài của một chủ đề. */
    interface TopicCount {
        UUID getTopicId();

        long getTotal();
    }

    /** Số câu của một bài (đọc từ view v_lesson_sentence_counts). */
    interface SentenceCount {
        UUID getLessonId();

        long getSentenceCount();
    }

    /** Chỉ trả bài còn hiển thị cho học viên: đúng trạng thái và chưa xoá mềm. */
    @EntityGraph(attributePaths = "topic")
    Optional<Lesson> findBySlugAndStatusAndDeletedAtIsNull(String slug, LessonStatus status);

    Optional<Lesson> findByIdAndStatusAndDeletedAtIsNull(UUID id, LessonStatus status);

    long countByTopicIdAndStatusAndDeletedAtIsNull(UUID topicId, LessonStatus status);

    @Query("""
            SELECT l.topic.id AS topicId, COUNT(l) AS total
            FROM Lesson l
            WHERE l.status = com.lingualoop.backend.lesson.enums.LessonStatus.APPROVED AND l.deletedAt IS NULL
            GROUP BY l.topic.id""")
    List<TopicCount> countApprovedGroupByTopic();

    @Query(value = """
            SELECT lesson_id AS lessonId, sentence_count AS sentenceCount
            FROM v_lesson_sentence_counts
            WHERE lesson_id IN (:lessonIds)""", nativeQuery = true)
    List<SentenceCount> findSentenceCounts(@Param("lessonIds") Collection<UUID> lessonIds);

    /** {@code perTopic} bài xem nhiều nhất của mỗi chủ đề đã duyệt, trong một truy vấn. */
    @Query(value = """
            SELECT x.*
            FROM (
                SELECT l.*, row_number() OVER (
                           PARTITION BY l.topic_id ORDER BY l.view_count DESC, l.sort_order, l.id) AS rn
                FROM lessons l
                JOIN topics t ON t.id = l.topic_id AND t.status = 'APPROVED'
                WHERE l.status = 'APPROVED' AND l.deleted_at IS NULL
            ) x
            WHERE x.rn <= :perTopic
            ORDER BY x.topic_id, x.rn""", nativeQuery = true)
    List<Lesson> findTopPopularPerTopic(@Param("perTopic") int perTopic);

    @Query("""
            SELECT l FROM Lesson l JOIN UserLessonProgress ulp ON l.id = ulp.lessonId
            WHERE ulp.userId = :userId AND ulp.completedAt IS NULL
              AND l.status = com.lingualoop.backend.lesson.enums.LessonStatus.APPROVED AND l.deletedAt IS NULL
            ORDER BY ulp.lastActivityAt DESC""")
    List<Lesson> findContinueLessons(@Param("userId") UUID userId, Pageable pageable);

    @Query("""
            SELECT l FROM Lesson l
            WHERE l.topic.id = :topicId AND l.id <> :excludeLessonId
              AND l.status = com.lingualoop.backend.lesson.enums.LessonStatus.APPROVED AND l.deletedAt IS NULL
            ORDER BY l.viewCount DESC""")
    List<Lesson> findRelatedLessons(@Param("topicId") UUID topicId,
                                    @Param("excludeLessonId") UUID excludeLessonId, Pageable pageable);
}
