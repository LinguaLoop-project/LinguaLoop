package com.lingualoop.backend.subscription.repository;

import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.subscription.entity.UsageCounter;

/**
 * Bộ đếm lượt dùng. Giữ hạn mức đúng khi nhiều yêu cầu đồng thời bằng UPDATE có điều kiện: kiểm tra {@code used < limit}
 * và tăng nằm trong một câu lệnh nên Postgres khoá dòng trong khoảnh khắc đó và chỉ một yêu cầu được lượt cuối. Cách này
 * thay cho khoá bi quan (người dùng chờ nhau) hay khoá lạc quan (phải thử lại khi xung đột, vốn hay gặp khi bấm đúp).
 */
public interface UsageCounterRepository extends JpaRepository<UsageCounter, UsageCounter.Key> {

    /** Tạo dòng của kỳ này (used = 0) nếu chưa có; hai yêu cầu đầu kỳ đồng thời thì một bên bỏ qua. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(nativeQuery = true, value = """
            INSERT INTO usage_counters (user_id, feature, period_start, used)
            VALUES (:userId, :feature, :periodStart, 0)
            ON CONFLICT (user_id, feature, period_start) DO NOTHING""")
    int createIfAbsent(@Param("userId") UUID userId, @Param("feature") String feature,
            @Param("periodStart") LocalDate periodStart);

    /** Tăng một lượt nếu còn dưới {@code limit}. Trả về 0 khi đã hết lượt. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(nativeQuery = true, value = """
            UPDATE usage_counters SET used = used + 1
            WHERE user_id = :userId AND feature = :feature AND period_start = :periodStart AND used < :limit""")
    int incrementBelow(@Param("userId") UUID userId, @Param("feature") String feature,
            @Param("periodStart") LocalDate periodStart, @Param("limit") int limit);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(nativeQuery = true, value = """
            UPDATE usage_counters SET used = GREATEST(used - 1, 0)
            WHERE user_id = :userId AND feature = :feature AND period_start = :periodStart""")
    int decrement(@Param("userId") UUID userId, @Param("feature") String feature,
            @Param("periodStart") LocalDate periodStart);

    List<UsageCounter> findByIdUserIdAndIdPeriodStartIn(UUID userId, Collection<LocalDate> periodStarts);

    @Modifying
    @Query("DELETE FROM UsageCounter c WHERE c.id.userId = :userId")
    int deleteAllOf(@Param("userId") UUID userId);
}
