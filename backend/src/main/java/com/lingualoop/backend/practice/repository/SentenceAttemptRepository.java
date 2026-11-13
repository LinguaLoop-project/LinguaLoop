package com.lingualoop.backend.practice.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.lingualoop.backend.practice.entity.SentenceAttempt;

@Repository
public interface SentenceAttemptRepository extends JpaRepository<SentenceAttempt, Long> {

    /** Lượt nghe chép mới nhất của mỗi câu trong bài, theo thứ tự câu. */
    @Query(value = """
            SELECT t.* FROM (
                SELECT DISTINCT ON (a.sentence_id) a.*, s.start_ms AS sentence_order
                FROM sentence_attempts a JOIN sentences s ON s.id = a.sentence_id
                WHERE a.user_id = :userId AND s.lesson_id = :lessonId AND a.mode = 'dictation'
                ORDER BY a.sentence_id, a.created_at DESC, a.id DESC) t
            ORDER BY t.sentence_order""", nativeQuery = true)
    List<SentenceAttempt> findLatestDictationPerSentence(@Param("userId") UUID userId,
            @Param("lessonId") UUID lessonId);

    /** Lượt nghe chép mới nhất của một câu (cùng thời điểm thì lấy lượt có id lớn hơn). */
    @Query(value = """
            SELECT * FROM sentence_attempts
            WHERE user_id = :userId AND sentence_id = :sentenceId AND mode = 'dictation'
            ORDER BY created_at DESC, id DESC LIMIT 1""", nativeQuery = true)
    Optional<SentenceAttempt> findLatestDictationOfSentence(@Param("userId") UUID userId,
            @Param("sentenceId") UUID sentenceId);

    /** Lượt đã lưu cho một {@code clientRequestId} của người dùng (BR-DI-21), nếu có. */
    @Query(value = """
            SELECT id FROM sentence_attempts WHERE user_id = :userId AND client_request_id = :clientRequestId""",
            nativeQuery = true)
    Optional<Long> findIdByClientRequestId(@Param("userId") UUID userId,
            @Param("clientRequestId") UUID clientRequestId);

    /** Mọi lượt nghe chép của một câu, mới nhất trước. */
    @Query(value = """
            SELECT * FROM sentence_attempts
            WHERE user_id = :userId AND sentence_id = :sentenceId AND mode = 'dictation'
            ORDER BY created_at DESC, id DESC""", nativeQuery = true)
    List<SentenceAttempt> findDictationOfSentence(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId);

    /** Một lượt nghe chép cụ thể, chỉ khi thuộc đúng người dùng và đúng câu. */
    @Query(value = """
            SELECT * FROM sentence_attempts
            WHERE id = :attemptId AND user_id = :userId AND sentence_id = :sentenceId AND mode = 'dictation'""",
            nativeQuery = true)
    Optional<SentenceAttempt> findDictationById(@Param("userId") UUID userId, @Param("sentenceId") UUID sentenceId,
            @Param("attemptId") long attemptId);

    /** Số lượt nghe chép của người dùng ở từng câu trong bài (câu chưa làm không có dòng). */
    @Query(value = """
            SELECT a.sentence_id AS sentenceId, count(*) AS attemptCount
            FROM sentence_attempts a JOIN sentences s ON s.id = a.sentence_id
            WHERE a.user_id = :userId AND s.lesson_id = :lessonId AND a.mode = 'dictation'
            GROUP BY a.sentence_id""", nativeQuery = true)
    List<AttemptCount> countDictationPerSentence(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId);

    interface AttemptCount {
        UUID getSentenceId();

        long getAttemptCount();
    }

    /** Các lượt Easy gần nhất của một câu, mới nhất trước. */
    @Query(value = """
            SELECT * FROM sentence_attempts
            WHERE user_id = :userId AND sentence_id = :sentenceId AND mode = 'dictation' AND level = 'easy'
            ORDER BY created_at DESC, id DESC LIMIT :limit""", nativeQuery = true)
    List<SentenceAttempt> findRecentEasyAttempts(@Param("userId") UUID userId,
            @Param("sentenceId") UUID sentenceId, @Param("limit") int limit);
}
