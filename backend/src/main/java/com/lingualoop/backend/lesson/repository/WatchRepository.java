package com.lingualoop.backend.lesson.repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.jdbc.core.simple.JdbcClient;
import org.springframework.stereotype.Repository;

import lombok.RequiredArgsConstructor;

/** Truy vấn của Học thụ động (UC-TC-04): luồng video, lời thoại và lượt thích. */
@Repository
@RequiredArgsConstructor
public class WatchRepository {

    /** Bài còn hiển thị cho học viên (BR-TC-03): thư viện chung, đã xuất bản, chưa xóa. */
    private static final String VISIBLE = "l.kind = 'library' AND l.status = 'published' AND l.deleted_at IS NULL";

    private final JdbcClient jdbc;

    /** Một bài trong luồng, chưa kèm lời thoại. */
    public record LessonRow(UUID id, String title, String youtubeId, int durationSec, String cefrLevel,
            String topicName, boolean pro, long likeCount, boolean liked) {
    }

    /** Một câu lời thoại của một bài. */
    public record LineRow(UUID id, UUID lessonId, String textEn, String textVi, String ipaUs, String ipaUk, int startMs,
            int endMs) {
    }

    /**
     * Một trang của luồng (BR-TC-13): bài còn hiển thị, có lời thoại, dài tối đa {@code maxDurationSec} giây, không có
     * bài Pro khi {@code pro} là false. Bài {@code start} (nếu hợp lệ) đứng đầu và được nhận dù dài hơn; sau đó bài học
     * viên chưa luyện câu nào đứng trước, thứ tự trong mỗi nhóm xáo theo {@code seed} nên cố định trong một phiên xem.
     * Lấy dư một bài để biết còn trang sau.
     */
    public List<LessonRow> findFeed(UUID userId, boolean pro, int maxDurationSec, UUID start, String seed, int page,
            int size) {
        return jdbc.sql("""
                SELECT l.id, l.title, l.youtube_id, l.duration_sec, l.cefr_level, t.name AS topic_name, l.is_pro,
                       (SELECT count(*) FROM lesson_likes k WHERE k.lesson_id = l.id) AS like_count,
                       EXISTS (SELECT 1 FROM lesson_likes k WHERE k.lesson_id = l.id AND k.user_id = :user) AS liked
                FROM lessons l
                LEFT JOIN topics t ON t.id = l.topic_id
                WHERE %s
                  AND (NOT l.is_pro OR :pro)
                  AND (l.duration_sec <= :maxDuration OR l.id = CAST(:start AS uuid))
                  AND EXISTS (SELECT 1 FROM sentences s WHERE s.lesson_id = l.id AND s.deleted_at IS NULL)
                ORDER BY COALESCE(l.id = CAST(:start AS uuid), false) DESC,
                         EXISTS (SELECT 1 FROM sentence_attempts a JOIN sentences s ON s.id = a.sentence_id
                                 WHERE a.user_id = :user AND s.lesson_id = l.id),
                         md5(l.id::text || :seed), l.id
                LIMIT :limit OFFSET :offset""".formatted(VISIBLE))
                .param("user", userId).param("pro", pro).param("maxDuration", maxDurationSec)
                .param("start", start).param("seed", seed)
                .param("limit", size + 1).param("offset", page * size)
                .query((rs, n) -> new LessonRow(rs.getObject("id", UUID.class), rs.getString("title"),
                        rs.getString("youtube_id"), rs.getInt("duration_sec"), rs.getString("cefr_level"),
                        rs.getString("topic_name"), rs.getBoolean("is_pro"), rs.getLong("like_count"),
                        rs.getBoolean("liked")))
                .list();
    }

    /** Có bài Pro nào đủ điều kiện vào luồng không: để mời học viên gói Free nâng cấp. */
    public boolean existsProInFeed(int maxDurationSec) {
        return Boolean.TRUE.equals(jdbc.sql("""
                SELECT EXISTS (SELECT 1 FROM lessons l
                               WHERE %s AND l.is_pro AND l.duration_sec <= :maxDuration
                                 AND EXISTS (SELECT 1 FROM sentences s
                                             WHERE s.lesson_id = l.id AND s.deleted_at IS NULL))""".formatted(VISIBLE))
                .param("maxDuration", maxDurationSec)
                .query(Boolean.class).single());
    }

    /** Lời thoại của các bài, theo thứ tự thời gian trong từng bài. */
    public List<LineRow> findLines(Collection<UUID> lessonIds) {
        if (lessonIds.isEmpty()) {
            return List.of();
        }
        return jdbc.sql("""
                SELECT id, lesson_id, text_en, text_vi, ipa_us, ipa_uk, start_ms, end_ms FROM sentences
                WHERE lesson_id IN (:lessons) AND deleted_at IS NULL
                ORDER BY lesson_id, start_ms, id""")
                .param("lessons", lessonIds)
                .query((rs, n) -> new LineRow(rs.getObject("id", UUID.class), rs.getObject("lesson_id", UUID.class),
                        rs.getString("text_en"), rs.getString("text_vi"), rs.getString("ipa_us"),
                        rs.getString("ipa_uk"), rs.getInt("start_ms"), rs.getInt("end_ms")))
                .list();
    }

    /** Bài còn hiển thị có phải bài Pro không; trống khi bài không có, chưa xuất bản, đã xóa hoặc là bài cá nhân. */
    public Optional<Boolean> findVisibleLessonPro(UUID lessonId) {
        return jdbc.sql("SELECT l.is_pro FROM lessons l WHERE l.id = :id AND " + VISIBLE)
                .param("id", lessonId)
                .query(Boolean.class).optional();
    }

    /** Bài của câu còn hiển thị có phải bài Pro không; trống khi câu hoặc bài không còn hiển thị. */
    public Optional<Boolean> findVisibleSentencePro(UUID sentenceId) {
        return jdbc.sql("""
                SELECT l.is_pro FROM sentences s JOIN lessons l ON l.id = s.lesson_id
                WHERE s.id = :id AND s.deleted_at IS NULL""" + " AND " + VISIBLE)
                .param("id", sentenceId)
                .query(Boolean.class).optional();
    }

    public void like(UUID userId, UUID lessonId) {
        jdbc.sql("""
                INSERT INTO lesson_likes (user_id, lesson_id) VALUES (:user, :lesson)
                ON CONFLICT (user_id, lesson_id) DO NOTHING""")
                .param("user", userId).param("lesson", lessonId)
                .update();
    }

    public void unlike(UUID userId, UUID lessonId) {
        jdbc.sql("DELETE FROM lesson_likes WHERE user_id = :user AND lesson_id = :lesson")
                .param("user", userId).param("lesson", lessonId)
                .update();
    }

    public long countLikes(UUID lessonId) {
        return jdbc.sql("SELECT count(*) FROM lesson_likes WHERE lesson_id = :lesson")
                .param("lesson", lessonId)
                .query(Long.class).single();
    }
}
