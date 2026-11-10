package com.lingualoop.backend.subscription.repository;

import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.subscription.entity.ProOrder;

public interface ProOrderRepository extends JpaRepository<ProOrder, UUID> {

    /** Kết thúc ngay các đơn paid đang hiệu lực (công cụ thử); trả số đơn đã kết thúc. */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query(value = """
            UPDATE pro_orders SET ends_at = :now
            WHERE user_id = :userId AND status = 'paid' AND starts_at <= :now AND ends_at > :now""",
            nativeQuery = true)
    int endActive(@Param("userId") UUID userId, @Param("now") Instant now);

    /** Đơn paid còn hiệu lực tại {@code now}; nhiều đơn thì lấy đơn hết hạn muộn nhất. */
    @Query(value = """
            SELECT * FROM pro_orders
            WHERE user_id = :userId AND status = 'paid' AND starts_at <= :now AND ends_at > :now
            ORDER BY ends_at DESC LIMIT 1""", nativeQuery = true)
    Optional<ProOrder> findActive(@Param("userId") UUID userId, @Param("now") Instant now);
}
