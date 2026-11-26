package com.lingualoop.backend.audit.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.audit.dto.AuditLogView;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditActorRole;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.enums.AuditPeriod;
import com.lingualoop.backend.audit.service.AuditAdminService;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.common.response.PageResponse;

import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** Nhật ký thao tác (UC-NK-01). Chỉ quản trị viên, chỉ đọc (BR-NK-01, 02). */
@Validated
@RestController
@RequestMapping("/api/v1/admin/audit-logs")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminAuditLogController {

    private final AuditAdminService auditAdminService;

    /** Danh sách mới nhất trước, 50 mục mỗi trang, mặc định 7 ngày gần nhất (BR-NK-04). */
    @GetMapping
    public ApiResponse<PageResponse<AuditLogView.Row>> list(
            @RequestParam(required = false) AuditAction action,
            @RequestParam(required = false) AuditEntityType targetType,
            @RequestParam(required = false) AuditActorRole actorRole,
            @RequestParam(defaultValue = "D7") AuditPeriod period,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok(auditAdminService.list(action, targetType, actorRole, period, q, page));
    }

    /** Chi tiết một mục: đối tượng chứa, giá trị cũ và mới, lý do hoặc ghi chú, đối tượng mở được (UC-NK-01 Bước 6). */
    @GetMapping("/{id}")
    public ApiResponse<AuditLogView.Detail> detail(@PathVariable long id) {
        return ApiResponse.ok(auditAdminService.detail(id));
    }

}
