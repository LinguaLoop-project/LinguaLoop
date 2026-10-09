package com.lingualoop.backend.lesson.repository;

import com.lingualoop.backend.lesson.entity.UserLessonProgress;
import com.lingualoop.backend.lesson.entity.UserLessonProgressId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.UUID;

@Repository
public interface LessonProgressRepository extends JpaRepository<UserLessonProgress, UserLessonProgressId> {

    @Query("SELECT COUNT(ulp) FROM UserLessonProgress ulp WHERE ulp.userId = :userId AND ulp.completedAt IS NOT NULL AND ulp.lessonId IN (SELECT l.id FROM Lesson l WHERE l.topic.id = :topicId)")
    long countCompletedLessonsByUserAndTopic(@Param("userId") UUID userId, @Param("topicId") UUID topicId);
}
