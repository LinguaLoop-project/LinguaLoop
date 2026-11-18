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

    /**
     * Câu có thể ôn hôm nay của cả hai chế độ (BR-HT-20): loại câu đã ôn từ {@code dayStart}, câu của bài chưa xuất bản
     * hoặc đã xoá, và câu của bài Pro khi học viên dùng gói Free. Điểm lượt gần nhất thấp trước, bằng điểm thì câu thêm
     * vào danh sách sớm hơn trước.
     */
    @Query(value = """
            SELECT r.sentence_id AS sentenceId, r.mode AS mode, l.id AS lessonId, l.title AS lessonTitle,
                   l.youtube_id AS youtubeId, s.start_ms AS startMs, s.end_ms AS endMs,
                   s.text_en AS text, s.text_vi AS textVi, a.total_score AS lastScore
            FROM user_sentence_review r
            JOIN sentences s ON s.id = r.sentence_id AND s.deleted_at IS NULL
            JOIN lessons l ON l.id = s.lesson_id AND l.deleted_at IS NULL AND l.status = 'published'
            LEFT JOIN LATERAL (
                SELECT total_score FROM sentence_attempts
                WHERE user_id = r.user_id AND sentence_id = r.sentence_id AND mode = r.mode
                ORDER BY created_at DESC, id DESC LIMIT 1) a ON true
            WHERE r.user_id = :userId
              AND (r.last_reviewed_at IS NULL OR r.last_reviewed_at < :dayStart)
              AND (NOT l.is_pro OR :userPro)
            ORDER BY a.total_score ASC NULLS LAST, r.created_at ASC, r.sentence_id""", nativeQuery = true)
    List<PlanEntry> findReviewableToday(@Param("userId") UUID userId, @Param("userPro") boolean userPro,
            @Param("dayStart") Instant dayStart);

    /** Câu có đang trong danh sách Câu cần ôn của chế độ này không. */
    @Query(value = """
            SELECT EXISTS (SELECT 1 FROM user_sentence_review
                           WHERE user_id = :userId AND sentence_id = :sentenceId AND mode = :mode)""",
            nativeQuery = true)
    boolean isInList(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId, @Param("mode") String mode);

    /**
     * Đánh dấu câu đã ôn ({@code last_reviewed_at = now}). Chỉ đánh dấu khi học viên vừa có một lượt thật ở chế độ này từ
     * {@code since} trở lại đây (không tính lượt "Hiện cả câu"), để không đánh dấu khống. Trả về 0 khi không đủ điều kiện.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            UPDATE user_sentence_review r SET last_reviewed_at = :now
            WHERE r.user_id = :userId AND r.sentence_id = :sentenceId AND r.mode = :mode
              AND EXISTS (SELECT 1 FROM sentence_attempts a
                          WHERE a.user_id = r.user_id AND a.sentence_id = r.sentence_id AND a.mode = r.mode
                            AND NOT a.gave_up AND a.created_at >= :since)""", nativeQuery = true)
    int markReviewed(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId, @Param("mode") String mode,
            @Param("now") Instant now, @Param("since") Instant since);

    /**
     * Số câu đã ôn từ {@code since} (đầu ngày của học viên) theo từng chế độ, để trừ vào Định mức ôn ngày. Chỉ đếm câu
     * còn trong danh sách Câu cần ôn: câu đã gỡ ("Đã ổn") không còn dấu "đã ôn" nên không được đếm.
     */
    @Query(value = """
            SELECT r.mode AS mode, count(*) AS total
            FROM user_sentence_review r
            WHERE r.user_id = :userId AND r.last_reviewed_at >= :since
            GROUP BY r.mode""", nativeQuery = true)
    List<ModeCount> countReviewedSince(@Param("userId") UUID userId, @Param("since") Instant since);

    interface ModeCount {
        String getMode();

        long getTotal();
    }

    interface PlanEntry {
        UUID getSentenceId();

        String getMode();

        UUID getLessonId();

        String getLessonTitle();

        String getYoutubeId();

        Integer getStartMs();

        Integer getEndMs();

        String getText();

        String getTextVi();

        BigDecimal getLastScore();
    }

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
