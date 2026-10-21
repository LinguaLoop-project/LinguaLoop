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

    /** Mỗi dòng: {sentence_id, mode, điểm cao nhất của chế độ đó}. */
    @Query(value = """
            SELECT sentence_id, CAST(mode AS text), max(score)
            FROM sentence_attempts
            WHERE user_id = :userId AND sentence_id IN (:sentenceIds) AND score IS NOT NULL
            GROUP BY sentence_id, mode""", nativeQuery = true)
    List<Object[]> maxScoreBySentence(@Param("userId") UUID userId, @Param("sentenceIds") Collection<UUID> sentenceIds);
}
