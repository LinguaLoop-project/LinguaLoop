package com.lingualoop.backend.lesson.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.lesson.entity.UserLessonModeProgress;
import com.lingualoop.backend.lesson.entity.UserLessonModeProgressId;

public interface LessonModeProgressRepository extends JpaRepository<UserLessonModeProgress, UserLessonModeProgressId> {

    /**
     * Cộng thời gian học vào tiến độ theo chế độ (tạo dòng nếu chưa có). Cộng ngay trong SQL thay vì đọc rồi ghi để
     * hai lượt gần nhau không ghi đè mất thời gian của nhau.
     */
    @Modifying
    @Query(nativeQuery = true, value = """
            INSERT INTO user_lesson_mode_progress (user_id, lesson_id, mode, total_time_sec)
            VALUES (:userId, :lessonId, :mode, :seconds)
            ON CONFLICT (user_id, lesson_id, mode) DO UPDATE
            SET total_time_sec = user_lesson_mode_progress.total_time_sec + EXCLUDED.total_time_sec,
                updated_at = now()""")
    int addTime(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId, @Param("mode") String mode,
            @Param("seconds") int seconds);

    /** Chế độ hoàn thành khi mọi câu của bài đã có ít nhất một lượt ở chế độ này (BR-SHADOW-08). */
    @Modifying
    @Query(nativeQuery = true, value = """
            UPDATE user_lesson_mode_progress SET completed_at = now()
            WHERE user_id = :userId AND lesson_id = :lessonId AND mode = :mode AND completed_at IS NULL
              AND NOT EXISTS (
                  SELECT 1 FROM sentences s
                  WHERE s.lesson_id = :lessonId
                    AND NOT EXISTS (
                        SELECT 1 FROM sentence_attempts a
                        WHERE a.user_id = :userId AND a.sentence_id = s.id AND a.mode = :mode))""")
    int completeIfAllSentencesAttempted(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId,
            @Param("mode") String mode);
}
