package com.lingualoop.backend.lesson.repository;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

/** Bài đã lưu của học viên (UC-TC-05). */
@Repository
@RequiredArgsConstructor
public class LessonSaveRepository {

    private final JdbcClient jdbc;

    /** Một bài đã lưu, kèm dữ liệu để biết bài còn mở được không. */
    public record Row(UUID id, String title, String cefrLevel, String youtubeId, Integer durationSec,
            String topicName, boolean pro, boolean visible, Instant savedAt) {
    }

    /** Mọi bài đã lưu của học viên, mới lưu trước, kể cả bài đã gỡ xuất bản hoặc xóa. */
    public List<Row> findAll(UUID userId) {
        return jdbc.sql("""
                SELECT l.id, l.title, l.cefr_level, l.youtube_id, l.duration_sec, t.name AS topic_name, l.is_pro,
                       (l.kind = 'library' AND l.status = 'published' AND l.deleted_at IS NULL) AS visible,
                       s.created_at
                FROM lesson_saves s
                JOIN lessons l ON l.id = s.lesson_id
                LEFT JOIN topics t ON t.id = l.topic_id
                WHERE s.user_id = :user
                ORDER BY s.created_at DESC, l.id""")
                .param("user", userId)
                .query((rs, n) -> new Row(rs.getObject("id", UUID.class), rs.getString("title"),
                        rs.getString("cefr_level"), rs.getString("youtube_id"), (Integer) rs.getObject("duration_sec"),
                        rs.getString("topic_name"), rs.getBoolean("is_pro"), rs.getBoolean("visible"),
                        rs.getTimestamp("created_at").toInstant()))
                .list();
    }

    /** Lưu bài; đã lưu rồi thì giữ nguyên thời điểm lưu cũ. */
    public void save(UUID userId, UUID lessonId) {
        jdbc.sql("""
                INSERT INTO lesson_saves (user_id, lesson_id) VALUES (:user, :lesson)
                ON CONFLICT (user_id, lesson_id) DO NOTHING""")
                .param("user", userId).param("lesson", lessonId)
                .update();
    }

    public void unsave(UUID userId, UUID lessonId) {
        jdbc.sql("DELETE FROM lesson_saves WHERE user_id = :user AND lesson_id = :lesson")
                .param("user", userId).param("lesson", lessonId)
                .update();
    }

    public int unsaveAll(UUID userId, Collection<UUID> lessonIds) {
        if (lessonIds.isEmpty()) {
            return 0;
        }
        return jdbc.sql("DELETE FROM lesson_saves WHERE user_id = :user AND lesson_id IN (:ids)")
                .param("user", userId).param("ids", lessonIds)
                .update();
    }

    public boolean isSaved(UUID userId, UUID lessonId) {
        return Boolean.TRUE.equals(jdbc.sql("""
                SELECT EXISTS (SELECT 1 FROM lesson_saves WHERE user_id = :user AND lesson_id = :lesson)""")
                .param("user", userId).param("lesson", lessonId)
                .query(Boolean.class).single());
    }

    /** Trong các bài đã cho, những bài học viên đã lưu. */
    public Set<UUID> findSavedAmong(UUID userId, Collection<UUID> lessonIds) {
        if (lessonIds.isEmpty()) {
            return Set.of();
        }
        return Set.copyOf(jdbc.sql("SELECT lesson_id FROM lesson_saves WHERE user_id = :user AND lesson_id IN (:ids)")
                .param("user", userId).param("ids", lessonIds)
                .query(UUID.class).list());
    }
}
