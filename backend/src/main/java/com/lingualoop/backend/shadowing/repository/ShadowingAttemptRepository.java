package com.lingualoop.backend.shadowing.repository;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.shadowing.entity.SentenceAttempt;

public interface ShadowingAttemptRepository extends JpaRepository<SentenceAttempt, Long> {

    /** Lượt mới nhất của một câu cùng thống kê của người học trên câu đó. */
    interface LatestHead {

        UUID getSentenceId();

        Long getAttemptId();

        BigDecimal getScore();

        BigDecimal getAccuracyScore();

        BigDecimal getFluencyScore();

        BigDecimal getCompletenessScore();

        BigDecimal getProsodyScore();

        Instant getAttemptedAt();

        BigDecimal getBestScore();

        Long getAttemptCount();
    }

    /**
     * Lượt mới nhất của từng câu đã đọc trong bài, theo thứ tự câu. Dùng SQL gốc vì cần {@code DISTINCT ON} của
     * Postgres và view {@code v_user_sentence_stats}.
     */
    @Query(nativeQuery = true, value = """
            SELECT t.sentence_id AS "sentenceId", t.id AS "attemptId", t.score AS "score",
                   t.accuracy_score AS "accuracyScore", t.fluency_score AS "fluencyScore",
                   t.completeness_score AS "completenessScore", t.prosody_score AS "prosodyScore",
                   t.attempted_at AS "attemptedAt", t.best_score AS "bestScore", t.attempt_count AS "attemptCount"
            FROM (
                SELECT DISTINCT ON (a.sentence_id) a.sentence_id, a.id, a.score, a.accuracy_score, a.fluency_score,
                       a.completeness_score, a.prosody_score, a.attempted_at,
                       st.best_score, st.attempt_count, s.sort_order
                FROM sentence_attempts a
                JOIN sentences s ON s.id = a.sentence_id
                JOIN v_user_sentence_stats st
                  ON st.user_id = a.user_id AND st.sentence_id = a.sentence_id AND st.mode = a.mode
                WHERE a.user_id = :userId AND s.lesson_id = :lessonId AND a.mode = 'shadowing'
                ORDER BY a.sentence_id, a.attempted_at DESC, a.id DESC
            ) t
            ORDER BY t.sort_order""")
    List<LatestHead> findLatestByLesson(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId);

    /** Mã các lượt shadowing của người học trong bài, trước {@code beforeId}, lượt gần nhất đứng đầu. */
    @Query(nativeQuery = true, value = """
            SELECT a.id FROM sentence_attempts a JOIN sentences s ON s.id = a.sentence_id
            WHERE a.user_id = :userId AND s.lesson_id = :lessonId AND a.mode = 'shadowing' AND a.id < :beforeId
            ORDER BY a.id DESC LIMIT :limit""")
    List<Long> findPreviousIds(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId,
            @Param("beforeId") long beforeId, @Param("limit") int limit);

    /** Số lượt shadowing của người học trong bài có mã trong khoảng ({@code afterId}, {@code uptoId}]. */
    @Query(nativeQuery = true, value = """
            SELECT count(*) FROM sentence_attempts a JOIN sentences s ON s.id = a.sentence_id
            WHERE a.user_id = :userId AND s.lesson_id = :lessonId AND a.mode = 'shadowing'
              AND a.id > :afterId AND a.id <= :uptoId""")
    int countBetween(@Param("userId") UUID userId, @Param("lessonId") UUID lessonId,
            @Param("afterId") long afterId, @Param("uptoId") long uptoId);
}
