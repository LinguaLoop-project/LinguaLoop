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
     * Đưa câu vào danh sách. Câu đang trong danh sách giữ nguyên (kể cả lý do); câu đã gỡ được đưa lại như mới
     * thêm. Trả về số dòng thay đổi: 1 khi câu vừa được thêm hoặc thêm lại, 0 khi câu đã ở trong danh sách.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            INSERT INTO user_sentence_review (user_id, sentence_id, mode, status, reason)
            VALUES (:userId, :sentenceId, 'dictation', 'pending', :reason)
            ON CONFLICT (user_id, sentence_id, mode) DO UPDATE
                SET status = 'pending', reason = EXCLUDED.reason, created_at = now(), last_reviewed_at = NULL
                WHERE user_sentence_review.status = 'resolved'""", nativeQuery = true)
    int addDictation(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId,
            @Param("reason") String reason);

    /** Gỡ câu khỏi danh sách; trả về 0 khi câu không ở trong danh sách. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            UPDATE user_sentence_review SET status = 'resolved', last_reviewed_at = now()
            WHERE user_id = :userId AND sentence_id = :sentenceId AND mode = 'dictation' AND status = 'pending'""",
            nativeQuery = true)
    int resolveDictation(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId);

    @Query(value = """
            SELECT r.sentence_id FROM user_sentence_review r JOIN sentences s ON s.id = r.sentence_id
            WHERE r.user_id = :userId AND s.lesson_id = :lessonId AND r.mode = 'dictation' AND r.status = 'pending'""",
            nativeQuery = true)
    List<UUID> findPendingDictationSentenceIds(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId);

    @Query(value = """
            SELECT EXISTS (SELECT 1 FROM user_sentence_review
                           WHERE user_id = :userId AND sentence_id = :sentenceId AND mode = 'dictation'
                             AND status = 'pending')""", nativeQuery = true)
    boolean isPendingDictation(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId);

    /** Câu đã có ít nhất một lượt nghe chép: chữ của câu chưa làm không được lộ qua danh sách ôn hay ghi chú. */
    @Query(value = """
            SELECT EXISTS (SELECT 1 FROM sentence_attempts
                           WHERE user_id = :userId AND sentence_id = :sentenceId AND mode = 'dictation')""",
            nativeQuery = true)
    boolean hasDictationAttempt(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId);

    /** Câu cần ôn kèm điểm của lượt gần nhất: điểm thấp trước, bằng điểm thì câu mới thêm trước. */
    @Query(value = """
            SELECT r.sentence_id AS sentenceId, r.reason AS reason, r.created_at AS addedAt,
                   l.slug AS lessonSlug, l.title AS lessonTitle, s.sort_order AS sortOrder,
                   s.text AS text, s.text_vi AS textVi,
                   a.score AS lastScore, a.level AS lastLevel, a.attempted_at AS lastAttemptedAt
            FROM user_sentence_review r
            JOIN sentences s ON s.id = r.sentence_id
            JOIN lessons l ON l.id = s.lesson_id AND l.deleted_at IS NULL
            LEFT JOIN LATERAL (
                SELECT score, level, attempted_at FROM sentence_attempts
                WHERE user_id = r.user_id AND sentence_id = r.sentence_id AND mode = 'dictation'
                ORDER BY attempted_at DESC, id DESC LIMIT 1) a ON true
            WHERE r.user_id = :userId AND r.mode = 'dictation' AND r.status = 'pending'
            ORDER BY a.score ASC NULLS LAST, r.created_at DESC, r.sentence_id""", nativeQuery = true)
    List<ReviewEntry> findDictationEntries(@Param("userId") UUID userId);

    interface ReviewEntry {
        UUID getSentenceId();

        String getReason();

        Instant getAddedAt();

        String getLessonSlug();

        String getLessonTitle();

        Integer getSortOrder();

        String getText();

        String getTextVi();

        BigDecimal getLastScore();

        String getLastLevel();

        Instant getLastAttemptedAt();
    }
}
