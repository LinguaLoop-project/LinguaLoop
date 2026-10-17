package com.lingualoop.backend.practice.repository;

import java.util.List;
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
                SELECT DISTINCT ON (a.sentence_id) a.*, s.sort_order AS sentence_order
                FROM sentence_attempts a JOIN sentences s ON s.id = a.sentence_id
                WHERE a.user_id = :userId AND s.lesson_id = :lessonId AND a.mode = 'dictation'
                ORDER BY a.sentence_id, a.attempted_at DESC, a.id DESC) t
            ORDER BY t.sentence_order""", nativeQuery = true)
    List<SentenceAttempt> findLatestDictationPerSentence(@Param("userId") UUID userId,
            @Param("lessonId") UUID lessonId);

    /** Các lượt Easy gần nhất của một câu, mới nhất trước. */
    @Query(value = """
            SELECT * FROM sentence_attempts
            WHERE user_id = :userId AND sentence_id = :sentenceId AND mode = 'dictation' AND level = 'easy'
            ORDER BY attempted_at DESC, id DESC LIMIT :limit""", nativeQuery = true)
    List<SentenceAttempt> findRecentEasyAttempts(@Param("userId") UUID userId,
            @Param("sentenceId") UUID sentenceId, @Param("limit") int limit);
}
