package com.lingualoop.backend.lesson.service;

import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.lesson.enums.PracticeMode;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class LessonProgressServiceImpl implements LessonProgressService {

    private final JdbcClient jdbc;

    @Override
    @Transactional
    public void recordActivity(UUID userId, UUID lessonId, PracticeMode mode, int timeSpentSec) {
        // Dòng tiến độ bài phải có trước vì tiến độ theo chế độ tham chiếu tới nó (khoá ngoại).
        jdbc.sql("""
                INSERT INTO user_lesson_progress (user_id, lesson_id) VALUES (:user, :lesson)
                ON CONFLICT (user_id, lesson_id) DO UPDATE SET last_activity_at = now()""")
                .param("user", userId).param("lesson", lessonId)
                .update();

        jdbc.sql("""
                INSERT INTO user_lesson_mode_progress (user_id, lesson_id, mode, total_time_sec)
                VALUES (:user, :lesson, :mode, :seconds)
                ON CONFLICT (user_id, lesson_id, mode) DO UPDATE
                SET total_time_sec = user_lesson_mode_progress.total_time_sec + EXCLUDED.total_time_sec,
                    updated_at = now()""")
                .param("user", userId).param("lesson", lessonId).param("mode", mode.name())
                .param("seconds", Math.max(timeSpentSec, 0))
                .update();

        // Chế độ hoàn thành khi mọi câu của bài đã có ít nhất một lượt ở chế độ này (BR-SHADOW-08).
        jdbc.sql("""
                UPDATE user_lesson_mode_progress SET completed_at = now()
                WHERE user_id = :user AND lesson_id = :lesson AND mode = :mode AND completed_at IS NULL
                  AND NOT EXISTS (
                      SELECT 1 FROM sentences s
                      WHERE s.lesson_id = :lesson
                        AND NOT EXISTS (
                            SELECT 1 FROM sentence_attempts a
                            WHERE a.user_id = :user AND a.sentence_id = s.id AND a.mode = :mode))""")
                .param("user", userId).param("lesson", lessonId).param("mode", mode.name())
                .update();
    }
}
