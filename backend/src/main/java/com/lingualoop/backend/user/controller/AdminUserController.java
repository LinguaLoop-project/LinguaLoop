package com.lingualoop.backend.user.controller;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.AdminUserView;
import com.lingualoop.backend.user.dto.ContentTransferView;
import com.lingualoop.backend.user.dto.request.ChangeRoleRequest;
import com.lingualoop.backend.user.dto.request.GrantCreditRequest;
import com.lingualoop.backend.user.dto.request.LockUserRequest;
import com.lingualoop.backend.user.dto.request.TransferAllRequest;
import com.lingualoop.backend.user.enums.AccountPlan;
import com.lingualoop.backend.user.enums.AccountStatus;
import com.lingualoop.backend.user.service.ContentTransferService;
import com.lingualoop.backend.user.service.UserAdminService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/**
 * Quản trị tài khoản (UC-QT-01 đến 04) và giao toàn bộ nội dung của một giáo viên (UC-QT-07). Chỉ quản trị viên
 * (BR-QT-01).
 */
@Validated
@RestController
@RequestMapping("/api/v1/admin/users")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminUserController {

    private final UserAdminService userAdminService;
    private final ContentTransferService contentTransferService;

    /** Danh sách tài khoản, 20 mỗi trang, mới tham gia trước (UC-QT-01, BR-QT-10). */
    @GetMapping
    public ApiResponse<PageResponse<AdminUserView.Row>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) AccountPlan plan,
            @RequestParam(required = false) AccountStatus status,
            @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok(userAdminService.list(q, role, plan, status, page));
    }

    @GetMapping("/{userId}")
    public ApiResponse<AdminUserView.Detail> detail(@PathVariable UUID userId) {
        return ApiResponse.ok(userAdminService.detail(userId));
    }

    /** Khóa kèm lý do và kết thúc mọi phiên đăng nhập (UC-QT-02). */
    @PostMapping("/{userId}/lock")
    public ApiResponse<AdminUserView.Detail> lock(@CurrentUserId UUID adminId, @PathVariable UUID userId,
            @Valid @RequestBody LockUserRequest request) {
        return ApiResponse.ok(userAdminService.lock(adminId, userId, request.reason()));
    }

    /** Mở khóa (UC-QT-03). */
    @PostMapping("/{userId}/unlock")
    public ApiResponse<AdminUserView.Detail> unlock(@CurrentUserId UUID adminId, @PathVariable UUID userId) {
        return ApiResponse.ok(userAdminService.unlock(adminId, userId));
    }

    /** Đổi vai trò giữa Học viên và Giáo viên (UC-QT-04). */
    @PostMapping("/{userId}/role")
    public ApiResponse<AdminUserView.Detail> changeRole(@CurrentUserId UUID adminId, @PathVariable UUID userId,
            @Valid @RequestBody ChangeRoleRequest request) {
        return ApiResponse.ok(userAdminService.changeRole(adminId, userId, request.targetRole()));
    }

    /** Cấp credit cho giáo viên kèm ghi chú (UC-GA-07). */
    @PostMapping("/{userId}/credits")
    public ApiResponse<AdminUserView.Detail> grantCredit(@CurrentUserId UUID adminId, @PathVariable UUID userId,
            @Valid @RequestBody GrantCreditRequest request) {
        return ApiResponse.ok(userAdminService.grantCredit(adminId, userId, request.credits(), request.note()));
    }

        /** Tóm tắt nội dung thư viện của giáo viên trước khi giao toàn bộ (UC-QT-07 Bước 2). */
    @GetMapping("/{userId}/content-summary")
    public ApiResponse<ContentTransferView.TeacherSummary> contentSummary(@PathVariable UUID userId) {
        return ApiResponse.ok(contentTransferService.summary(userId));
    }

    /** Giao toàn bộ bài học và bộ thẻ thư viện của giáo viên cho giáo viên khác (UC-QT-07). */
    @PostMapping("/{userId}/transfer-all")
    public ApiResponse<ContentTransferView.Result> transferAll(@CurrentUserId UUID adminId,
            @PathVariable UUID userId, @Valid @RequestBody TransferAllRequest request) {
        return ApiResponse.ok(contentTransferService.transferAll(adminId, userId, request));
    }
}
