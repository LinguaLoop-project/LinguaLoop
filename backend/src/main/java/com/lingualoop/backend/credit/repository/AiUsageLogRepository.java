package com.lingualoop.backend.credit.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.credit.entity.AiUsageLog;

public interface AiUsageLogRepository extends JpaRepository<AiUsageLog, Long> {

    /** Dòng của phiên giọng nói chưa có chi phí, khóa để hai lần báo cùng lúc không cùng điền (BR-GA-12). */
    @Query(value = """
            SELECT * FROM ai_usage_logs
            WHERE session_id = :sessionId AND user_id = :userId
              AND cost_estimated AND input_units = 0 AND output_units = 0
            ORDER BY id LIMIT 1
            FOR UPDATE""", nativeQuery = true)
    Optional<AiUsageLog> findLivePendingForUpdate(@Param("userId") UUID userId, @Param("sessionId") UUID sessionId);

    /**
     * Phiên giọng nói đã trừ credit mà trình duyệt không báo số đơn vị xử lý trước {@code cutoff} (đóng trang, mất mạng).
     * {@code SKIP LOCKED} để không chờ lần báo đang được điền.
     */
    @Query(value = """
            SELECT * FROM ai_usage_logs
            WHERE session_id IS NOT NULL AND cost_estimated AND input_units = 0 AND output_units = 0
              AND status = 'success' AND created_at < :cutoff
            ORDER BY created_at LIMIT :limit
            FOR UPDATE SKIP LOCKED""", nativeQuery = true)
    List<AiUsageLog> lockStaleLivePending(@Param("cutoff") Instant cutoff, @Param("limit") int limit);
}
