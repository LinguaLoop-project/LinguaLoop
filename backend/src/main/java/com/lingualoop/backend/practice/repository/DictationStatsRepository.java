package com.lingualoop.backend.practice.repository;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.Repository;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.practice.entity.SentenceAttempt;

/**
 * Đọc view v_user_dictation_stats (chỉ lượt đầu tiên của mỗi câu, đã loại lượt làm lại và bỏ cuộc). "Ngày" của view
 * và ngày của mốc {@code since} cùng tính theo múi giờ của học viên (users.timezone).
 */
public interface DictationStatsRepository extends Repository<SentenceAttempt, Long> {

    /** Mỗi dòng: {nhóm từ, tổng số từ, số từ sai}. */
    @Query(value = """
            SELECT s.word_class, CAST(sum(s.total_words) AS bigint), CAST(sum(s.wrong_words) AS bigint)
            FROM v_user_dictation_stats s
            JOIN users u ON u.id = s.user_id
            WHERE s.user_id = :userId AND s.day >= CAST(CAST(:since AS timestamptz) AT TIME ZONE u.timezone AS date)
            GROUP BY s.word_class""", nativeQuery = true)
    List<Object[]> sumByWordClass(@Param("userId") UUID userId, @Param("since") Instant since);
}
