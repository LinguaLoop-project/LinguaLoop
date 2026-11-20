package com.lingualoop.backend.user.service;

import java.util.UUID;

import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.AdminUserView;
import com.lingualoop.backend.user.enums.AccountPlan;
import com.lingualoop.backend.user.enums.AccountStatus;

/** Quản trị tài khoản của quản trị viên (UC-QT-01 đến 04). Quyền quản trị viên do controller kiểm (BR-QT-01). */
public interface UserAdminService {

    /**
     * Danh sách tài khoản, mới tham gia trước, 20 mỗi trang (BR-QT-10). {@code plan} chỉ áp dụng cho học viên. Tham số
     * {@code null} = không lọc.
     */
    PageResponse<AdminUserView.Row> list(String q, Role role, AccountPlan plan, AccountStatus status, int page);

    /** Chi tiết tài khoản; không có ném {@code USER_NOT_FOUND}. */
    AdminUserView.Detail detail(UUID userId);

    /**
     * Khóa tài khoản học viên hoặc giáo viên kèm lý do và kết thúc mọi phiên đăng nhập (UC-QT-02, BR-QT-02, 03). Tài
     * khoản của chính mình hoặc quản trị viên ném {@code USER_PROTECTED}; đã khóa ném {@code USER_ALREADY_LOCKED}.
     */
    AdminUserView.Detail lock(UUID adminId, UUID userId, String reason);

    /** Mở khóa (UC-QT-03); tài khoản đang hoạt động ném {@code USER_NOT_LOCKED}. */
    AdminUserView.Detail unlock(UUID adminId, UUID userId);

    /**
     * Đổi vai trò giữa Học viên và Giáo viên (UC-QT-04, BR-QT-04). Lỗi: {@code BAD_REQUEST} khi {@code newRole} là
     * quản trị viên, {@code USER_PROTECTED}, {@code USER_LOCKED_ROLE_CHANGE}, {@code USER_ROLE_UNCHANGED},
     * {@code USER_TEACHER_HAS_CONTENT} (details {@code lessons}, {@code decks}), {@code USER_ACTIVE_PRO} (details
     * {@code endsAt}).
     */
    AdminUserView.Detail changeRole(UUID adminId, UUID userId, Role newRole);
}
