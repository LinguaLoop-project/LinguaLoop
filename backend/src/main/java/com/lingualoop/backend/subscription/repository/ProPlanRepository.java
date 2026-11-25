package com.lingualoop.backend.subscription.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.lingualoop.backend.subscription.entity.ProPlan;

import jakarta.persistence.LockModeType;

public interface ProPlanRepository extends JpaRepository<ProPlan, UUID> {

    /** Danh sách theo thời hạn tăng dần (BR-GA-07); cùng thời hạn thì gói tạo trước đứng trước. */
    List<ProPlan> findAllByOrderByMonthsAscCreatedAtAsc();

    /** Gói đang bán cho học viên chọn (BR-PR-11), cùng thứ tự với danh sách quản trị. */
    List<ProPlan> findAllByOnSaleTrueOrderByMonthsAscCreatedAtAsc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM ProPlan p WHERE p.id = :id")
    Optional<ProPlan> findForUpdate(@Param("id") UUID id);

    /** Tên trùng với gói khác, không phân biệt hoa thường (khớp {@code uq_pro_plans_name}). */
    @Query(value = """
            SELECT EXISTS (SELECT 1 FROM pro_plans
                           WHERE lower(name) = lower(:name) AND (CAST(:excludeId AS uuid) IS NULL OR id <> :excludeId))""",
            nativeQuery = true)
    boolean nameTaken(@Param("name") String name, @Param("excludeId") UUID excludeId);

    /** Số lượt đã mua của mỗi gói = số đơn ở trạng thái Đã thanh toán (BR-GA-07, BR-PR-08). */
    @Query(value = """
            SELECT plan_id AS planId, count(*) AS purchases FROM pro_orders
            WHERE status = 'paid' AND plan_id IS NOT NULL GROUP BY plan_id""", nativeQuery = true)
    List<PurchaseCount> purchaseCounts();

    interface PurchaseCount {
        UUID getPlanId();

        long getPurchases();
    }
}
