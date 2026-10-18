package com.lingualoop.backend.lesson.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.lesson.entity.UserLessonProgress;
import com.lingualoop.backend.lesson.entity.UserLessonProgressId;

@Repository
public interface LessonProgressRepository extends JpaRepository<UserLessonProgress, UserLessonProgressId> {

    /**
     * Tạo dòng tiến độ bài (nếu chưa có) hoặc đẩy mốc hoạt động. Một câu lệnh nên hai yêu cầu đầu tiên đồng thời
     * của cùng một người dùng không đụng khoá chính.
     */
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT INTO user_lesson_progress (user_id, lesson_id) VALUES (:userId, :lessonId)
            ON CONFLICT (user_id, lesson_id) DO UPDATE SET last_activity_at = now()""")
    int touch(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId);

    @Query("""
            SELECT COUNT(ulp) FROM UserLessonProgress ulp
            WHERE ulp.userId = :userId AND ulp.completedAt IS NOT NULL
              AND ulp.lessonId IN (SELECT l.id FROM Lesson l
                                   WHERE l.topic.id = :topicId
                                     AND l.status = com.lingualoop.backend.lesson.enums.LessonStatus.APPROVED
                                     AND l.deletedAt IS NULL)""")
    long countCompletedLessonsByUserAndTopic(@Param("userId") UUID userId, @Param("topicId") UUID topicId);

    /** Số bài đã hoàn thành của người dùng theo từng chủ đề, trong một truy vấn. */
    @Query("""
            SELECT l.topic.id AS topicId, COUNT(ulp) AS total
            FROM UserLessonProgress ulp JOIN Lesson l ON l.id = ulp.lessonId
            WHERE ulp.userId = :userId AND ulp.completedAt IS NOT NULL
              AND l.status = com.lingualoop.backend.lesson.enums.LessonStatus.APPROVED AND l.deletedAt IS NULL
            GROUP BY l.topic.id""")
    List<LessonRepository.TopicCount> countCompletedGroupByTopic(@Param("userId") UUID userId);
}
