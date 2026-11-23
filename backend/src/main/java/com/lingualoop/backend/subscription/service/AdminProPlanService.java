package com.lingualoop.backend.subscription.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.subscription.dto.ProPlanView;
import com.lingualoop.backend.subscription.dto.request.ProPlanRequest;

/** Quản lý gói Pro (UC-GA-03 đến 06). Chỉ quản trị viên. Mọi thao tác ghi được ghi nhật ký (BR-GA-09). */
public interface AdminProPlanService {

    /** Mọi gói, thời hạn tăng dần, kèm số lượt đã mua (UC-GA-03). */
    List<ProPlanView> list();

    /** Thêm gói ở trạng thái ngừng bán (UC-GA-04). Trùng tên: {@code PRO_PLAN_NAME_TAKEN}. */
    ProPlanView create(UUID adminId, ProPlanRequest request);

    /**
     * Sửa gói; chỉ áp dụng cho lượt mua sau (BR-GA-08). Lỗi: {@code PRO_PLAN_STALE} (7a), {@code PRO_PLAN_UNCHANGED}
     * (5b), {@code PRO_PLAN_NAME_TAKEN} (6b).
     */
    ProPlanView update(UUID adminId, UUID planId, ProPlanRequest request);

    /** Bật hoặc ngừng bán (UC-GA-06). Gói đã ở trạng thái đó: {@code PRO_PLAN_STATUS_UNCHANGED} (4a). */
    ProPlanView setOnSale(UUID adminId, UUID planId, boolean onSale);
}
