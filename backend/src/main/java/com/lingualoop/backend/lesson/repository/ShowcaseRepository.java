package com.lingualoop.backend.lesson.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.lesson.dto.ShowcaseView;

import lombok.RequiredArgsConstructor;

/** Truy vấn bài học giới thiệu trên trang chủ công khai (BR-TC-20). */
@Repository
@RequiredArgsConstructor
public class ShowcaseRepository {

    /** Bài còn hiển thị cho học viên (BR-TC-03): thư viện chung, đã xuất bản, chưa xóa. */
    private static final String VISIBLE = "l.kind = 'library' AND l.status = 'published' AND l.deleted_at IS NULL";

    private final JdbcClient jdbc;

    /**
     * Tối đa {@code perLevel} bài mỗi trình độ, chọn và xếp theo {@code seed} nên giữ nguyên trong ngày. Chỉ lấy bài còn
     * hiển thị, có video và có lời thoại.
     */
    public List<ShowcaseView.Lesson> lessons(String seed, int perLevel) {
        return jdbc.sql("""
                WITH picked AS (
                    SELECT l.id, l.title, l.youtube_id, l.duration_sec, l.cefr_level, l.topic_id, l.is_pro,
                           row_number() OVER (PARTITION BY l.cefr_level ORDER BY md5(l.id::text || :seed)) AS rn
                    FROM lessons l
                    WHERE %s
                      AND l.youtube_id IS NOT NULL
                      AND EXISTS (SELECT 1 FROM sentences s WHERE s.lesson_id = l.id AND s.deleted_at IS NULL)
                )
                SELECT p.id, p.title, p.youtube_id, p.duration_sec, p.cefr_level, t.name AS topic_name, p.is_pro,
                       (SELECT count(*) FROM sentences s WHERE s.lesson_id = p.id AND s.deleted_at IS NULL) AS sentences
                FROM picked p
                LEFT JOIN topics t ON t.id = p.topic_id
                WHERE p.rn <= :perLevel
                ORDER BY md5(p.id::text || :seed)""".formatted(VISIBLE))
                .param("seed", seed).param("perLevel", perLevel)
                .query((rs, n) -> new ShowcaseView.Lesson(rs.getObject("id", UUID.class), rs.getString("title"),
                        rs.getString("youtube_id"), rs.getInt("duration_sec"), rs.getString("cefr_level"),
                        rs.getString("topic_name"), rs.getInt("sentences"), rs.getBoolean("is_pro")))
                .list();
    }

    /** Tên các chủ đề đang hiển thị (có ít nhất một bài còn hiển thị, BR-TC-03), nhiều bài nhất trước. */
    public List<String> topics(int limit) {
        return jdbc.sql("""
                SELECT t.name
                FROM topics t
                JOIN lessons l ON l.topic_id = t.id AND %s
                GROUP BY t.id, t.name
                ORDER BY count(*) DESC, t.name
                LIMIT :limit""".formatted(VISIBLE))
                .param("limit", limit)
                .query(String.class)
                .list();
    }
}
