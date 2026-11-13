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

    /** Số câu đã có ít nhất một lượt của người học, theo bài và chế độ. */
    interface AttemptedCount {
        UUID getLessonId();

        String getMode();

        long getAttempted();
    }

    /** Chỉ trả bài còn hiển thị cho học viên: thư viện chung, đã xuất bản, chưa xoá mềm. */
    @EntityGraph(attributePaths = "topic")
    @Query("""
            SELECT l FROM Lesson l
            WHERE l.id = :id AND l.kind = 'library'
              AND l.status = com.lingualoop.backend.lesson.enums.LessonStatus.PUBLISHED
              AND l.deletedAt IS NULL""")
    Optional<Lesson> findVisibleById(@Param("id") UUID id);

    @Query("""
            SELECT COUNT(l) FROM Lesson l
            WHERE l.topic.id = :topicId AND l.kind = 'library'
              AND l.status = com.lingualoop.backend.lesson.enums.LessonStatus.PUBLISHED AND l.deletedAt IS NULL""")
    long countVisibleByTopic(@Param("topicId") UUID topicId);

    @Query("""
            SELECT l.topic.id AS topicId, COUNT(l) AS total
            FROM Lesson l
            WHERE l.kind = 'library' AND l.status = com.lingualoop.backend.lesson.enums.LessonStatus.PUBLISHED
              AND l.deletedAt IS NULL
            GROUP BY l.topic.id""")
    List<TopicCount> countVisibleGroupByTopic();

    @Query(value = """
            SELECT lesson_id AS lessonId, sentence_count AS sentenceCount
            FROM v_lesson_sentence_counts
            WHERE lesson_id IN (:lessonIds)""", nativeQuery = true)
    List<SentenceCount> findSentenceCounts(@Param("lessonIds") Collection<UUID> lessonIds);

    /** {@code perTopic} bài xem nhiều nhất của mỗi chủ đề, trong một truy vấn. */
    @Query(value = """
            SELECT x.*
            FROM (
                SELECT l.*, row_number() OVER (
                           PARTITION BY l.topic_id ORDER BY l.view_count DESC, l.id) AS rn
                FROM lessons l
                WHERE l.kind = 'library' AND l.status = 'published' AND l.deleted_at IS NULL
            ) x
            WHERE x.rn <= :perTopic
            ORDER BY x.topic_id, x.rn""", nativeQuery = true)
    List<Lesson> findTopPopularPerTopic(@Param("perTopic") int perTopic);

    @Query("""
            SELECT l FROM Lesson l
            WHERE l.topic.id = :topicId AND l.id <> :excludeLessonId AND l.kind = 'library'
              AND l.status = com.lingualoop.backend.lesson.enums.LessonStatus.PUBLISHED AND l.deletedAt IS NULL
            ORDER BY l.viewCount DESC""")
    List<Lesson> findRelatedLessons(@Param("topicId") UUID topicId,
                                    @Param("excludeLessonId") UUID excludeLessonId, Pageable pageable);

    // ---- Tiến độ của người học, tính từ sentence_attempts ----

    /** Số câu (chưa xoá) đã có ít nhất một lượt của người học, theo bài và chế độ. */
    @Query(nativeQuery = true, value = """
            SELECT s.lesson_id AS "lessonId", a.mode AS "mode", COUNT(DISTINCT a.sentence_id) AS "attempted"
            FROM sentence_attempts a
            JOIN sentences s ON s.id = a.sentence_id AND s.deleted_at IS NULL
            WHERE a.user_id = :userId AND s.lesson_id IN (:lessonIds)
            GROUP BY s.lesson_id, a.mode""")
    List<AttemptedCount> countAttemptedSentences(@Param("userId") UUID userId,
            @Param("lessonIds") Collection<UUID> lessonIds);

    /** Bài đã có ít nhất một lượt làm của người học. */
    @Query(nativeQuery = true, value = """
            SELECT DISTINCT s.lesson_id
            FROM sentence_attempts a
            JOIN sentences s ON s.id = a.sentence_id
            WHERE a.user_id = :userId""")
    List<UUID> findAttemptedLessonIds(@Param("userId") UUID userId);

    /**
     * Bài đã hoàn thành: ở ít nhất một chế độ, mọi câu chưa xoá của bài đều có ít nhất một lượt. Bài không có câu
     * không bao giờ hoàn thành.
     */
    @Query(nativeQuery = true, value = """
            SELECT DISTINCT s0.lesson_id
            FROM sentences s0
            JOIN sentence_attempts a0 ON a0.sentence_id = s0.id AND a0.user_id = :userId
            WHERE EXISTS (
                SELECT 1 FROM (VALUES ('dictation'), ('shadowing')) AS m(mode)
                WHERE NOT EXISTS (
                    SELECT 1 FROM sentences s
                    WHERE s.lesson_id = s0.lesson_id AND s.deleted_at IS NULL
                      AND NOT EXISTS (
                          SELECT 1 FROM sentence_attempts a
                          WHERE a.user_id = :userId AND a.sentence_id = s.id AND a.mode = m.mode))
                  AND EXISTS (SELECT 1 FROM sentences s2 WHERE s2.lesson_id = s0.lesson_id AND s2.deleted_at IS NULL))""")
    List<UUID> findCompletedLessonIds(@Param("userId") UUID userId);

    /** Bài người học làm gần nhất, mới trước (kể cả bài đã hoàn thành). */
    @Query(nativeQuery = true, value = """
            SELECT s.lesson_id
            FROM sentence_attempts a
            JOIN sentences s ON s.id = a.sentence_id
            JOIN lessons l ON l.id = s.lesson_id
            WHERE a.user_id = :userId AND l.kind = 'library' AND l.status = 'published' AND l.deleted_at IS NULL
            GROUP BY s.lesson_id
            ORDER BY max(a.created_at) DESC""")
    List<UUID> findRecentLessonIds(@Param("userId") UUID userId, Pageable pageable);
}
