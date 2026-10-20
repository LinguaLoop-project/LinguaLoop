package com.lingualoop.backend.practice.repository;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.practice.entity.SentenceAttempt;

/** Truy vấn tổng hợp tiến độ trên sentence_attempts. Bảng sentences thuộc lesson nên chỉ đọc qua SQL. */
public interface PracticeProgressRepository extends Repository<SentenceAttempt, Long> {

    /** Mỗi dòng: {lesson_id, số câu có ít nhất một lượt dictation}. */
    @Query(value = """
            SELECT s.lesson_id, CAST(count(DISTINCT a.sentence_id) AS integer)
            FROM sentence_attempts a JOIN sentences s ON s.id = a.sentence_id
            WHERE a.user_id = :userId AND a.mode = 'dictation' AND s.lesson_id IN (:lessonIds)
            GROUP BY s.lesson_id""", nativeQuery = true)
    List<Object[]> countDictationSentencesByLesson(@Param("userId") UUID userId,
            @Param("lessonIds") Collection<UUID> lessonIds);

    /** Mỗi dòng: {sentence_id, điểm cao nhất}. */
    @Query(value = """
            SELECT sentence_id, max(score)
            FROM sentence_attempts
            WHERE user_id = :userId AND sentence_id IN (:sentenceIds) AND score IS NOT NULL
            GROUP BY sentence_id""", nativeQuery = true)
    List<Object[]> maxScoreBySentence(@Param("userId") UUID userId, @Param("sentenceIds") Collection<UUID> sentenceIds);
}
