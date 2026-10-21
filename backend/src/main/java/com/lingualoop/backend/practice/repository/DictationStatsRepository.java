package com.lingualoop.backend.practice.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.practice.entity.SentenceAttempt;

/** Đọc view v_user_dictation_stats (đã loại lượt làm lại và bỏ cuộc). */
public interface DictationStatsRepository extends Repository<SentenceAttempt, Long> {

    /** Mỗi dòng: {nhóm từ, tổng cơ hội, tổng lỗi} của mức normal và hard. */
    @Query(value = """
            SELECT word_class, CAST(sum(opportunities) AS bigint), CAST(sum(errors) AS bigint)
            FROM v_user_dictation_stats
            WHERE user_id = :userId AND day >= :sinceDay AND level IN ('normal', 'hard')
            GROUP BY word_class""", nativeQuery = true)
    List<Object[]> sumByWordClass(@Param("userId") UUID userId, @Param("sinceDay") LocalDate sinceDay);
}
