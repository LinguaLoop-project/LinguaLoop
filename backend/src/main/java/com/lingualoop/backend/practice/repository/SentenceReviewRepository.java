package com.lingualoop.backend.practice.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.practice.entity.SentenceReview;
import com.lingualoop.backend.practice.entity.SentenceReviewId;

@Repository
public interface SentenceReviewRepository extends JpaRepository<SentenceReview, SentenceReviewId> {

    /**
     * Đưa câu vào danh sách. Câu đang trong danh sách giữ nguyên (kể cả lý do). Trả về 1 khi câu vừa được thêm, 0 khi
     * câu đã ở trong danh sách.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO user_sentence_review (user_id, sentence_id, mode, reason)
            VALUES (:userId, :sentenceId, :mode, :reason)
            ON CONFLICT (user_id, sentence_id, mode) DO NOTHING""", nativeQuery = true)
    int add(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId, @Param("mode") String mode,
            @Param("reason") String reason);

    /** Gỡ câu khỏi danh sách (xoá dòng); trả về 0 khi câu không ở trong danh sách. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            DELETE FROM user_sentence_review
            WHERE user_id = :userId AND sentence_id = :sentenceId AND mode = :mode""", nativeQuery = true)
    int resolve(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId, @Param("mode") String mode);

    @Query(value = """
            SELECT r.sentence_id FROM user_sentence_review r JOIN sentences s ON s.id = r.sentence_id
            WHERE r.user_id = :userId AND s.lesson_id = :lessonId AND r.mode = :mode""",
            nativeQuery = true)
    List<UUID> findPendingSentenceIds(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId,
            @Param("mode") String mode);

    /** Câu đã có ít nhất một lượt ở chế độ này: điều kiện để ghim câu vào danh sách của chế độ đó. */
    @Query(value = """
            SELECT EXISTS (SELECT 1 FROM sentence_attempts
                           WHERE user_id = :userId AND sentence_id = :sentenceId
                             AND mode = :mode)""", nativeQuery = true)
    boolean hasAttempt(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId, @Param("mode") String mode);

    /** Câu đã có ít nhất một lượt ở nghe chép hoặc Shadowing: điều kiện để ghi chú câu (BR-SHADOW-17). */
    @Query(value = """
            SELECT EXISTS (SELECT 1 FROM sentence_attempts WHERE user_id = :userId AND sentence_id = :sentenceId)""",
            nativeQuery = true)
    boolean hasAnyAttempt(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId);

    /**
     * Câu cần ôn kèm điểm của lượt gần nhất cùng chế độ: điểm thấp trước, bằng điểm thì câu mới thêm trước. Truyền
     * {@code mode} để chỉ lấy một chế độ và {@code lessonId} để chỉ lấy một bài; để null thì không lọc.
     * {@code sortOrder} là thứ tự câu trong bài theo mốc thời gian.
     */
    @Query(value = """
            SELECT r.sentence_id AS sentenceId, r.mode AS mode, r.reason AS reason,
                   r.created_at AS addedAt, l.id AS lessonId, l.title AS lessonTitle, s.rn AS sortOrder,
                   s.text_en AS text, s.text_vi AS textVi,
                   a.total_score AS lastScore, a.level AS lastLevel, a.created_at AS lastAttemptedAt
            FROM user_sentence_review r
            JOIN (SELECT id, lesson_id, text_en, text_vi,
                         CAST(row_number() OVER (PARTITION BY lesson_id ORDER BY start_ms) AS integer) AS rn
                  FROM sentences WHERE deleted_at IS NULL) s ON s.id = r.sentence_id
            JOIN lessons l ON l.id = s.lesson_id AND l.deleted_at IS NULL
            LEFT JOIN LATERAL (
                SELECT total_score, level, created_at FROM sentence_attempts
                WHERE user_id = r.user_id AND sentence_id = r.sentence_id AND mode = r.mode
                ORDER BY created_at DESC, id DESC LIMIT 1) a ON true
            WHERE r.user_id = :userId
              AND (CAST(:mode AS text) IS NULL OR r.mode = CAST(:mode AS text))
              AND (CAST(:lessonId AS uuid) IS NULL OR l.id = CAST(:lessonId AS uuid))
            ORDER BY a.total_score ASC NULLS LAST, r.created_at DESC, r.sentence_id""", nativeQuery = true)
    List<ReviewEntry> findEntries(@Param("userId") UUID userId, @Param("mode") String mode,
            @Param("lessonId") UUID lessonId);

    interface ReviewEntry {
        UUID getSentenceId();

        String getMode();

        String getReason();

        Instant getAddedAt();

        UUID getLessonId();

        String getLessonTitle();

        Integer getSortOrder();

        String getText();

        String getTextVi();

        BigDecimal getLastScore();

        String getLastLevel();

        Instant getLastAttemptedAt();
    }
}
