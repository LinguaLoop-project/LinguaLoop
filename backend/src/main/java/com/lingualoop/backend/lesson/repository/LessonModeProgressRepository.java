package com.lingualoop.backend.lesson.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.lesson.entity.UserLessonModeProgress;
import com.lingualoop.backend.lesson.entity.UserLessonModeProgressId;

/** Ghi tiến độ theo chế độ bằng upsert để hai lượt nộp đồng thời không va khóa chính. */
public interface LessonModeProgressRepository extends Repository<UserLessonModeProgress, UserLessonModeProgressId> {

    /** Tạo dòng nếu chưa có, ngược lại cộng thêm thời gian. Dòng bài (user_lesson_progress) phải có trước. */
    @Modifying
    @Query(value = """
            INSERT INTO user_lesson_mode_progress (user_id, lesson_id, mode, total_time_sec)
            VALUES (:userId, :lessonId, CAST(:mode AS practice_mode), :seconds)
            ON CONFLICT (user_id, lesson_id, mode) DO UPDATE
            SET total_time_sec = user_lesson_mode_progress.total_time_sec + EXCLUDED.total_time_sec,
                updated_at = now()""", nativeQuery = true)
    void addTime(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId, @Param("mode") String mode,
            @Param("seconds") int seconds);

    /** Đặt thời điểm hoàn thành lần đầu; đã hoàn thành rồi thì giữ nguyên. */
    @Modifying
    @Query(value = """
            UPDATE user_lesson_mode_progress SET completed_at = COALESCE(completed_at, now())
            WHERE user_id = :userId AND lesson_id = :lessonId AND mode = CAST(:mode AS practice_mode)""",
            nativeQuery = true)
    void markCompleted(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId, @Param("mode") String mode);
}
