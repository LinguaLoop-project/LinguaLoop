package com.lingualoop.backend.audit.service;

import java.util.UUID;

import com.lingualoop.backend.audit.dto.AuditLogView;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditActorRole;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.enums.AuditPeriod;
import com.lingualoop.backend.common.response.PageResponse;

/** Xem nhật ký của quản trị viên: danh sách và chi tiết (UC-NK-01). Chỉ đọc. */
public interface AuditAdminService {

    /** 50 mục mỗi trang, mới nhất trước; mọi điều kiện {@code null} là không lọc (BR-NK-04). */
    PageResponse<AuditLogView.Row> list(AuditAction action, AuditEntityType targetType, AuditActorRole actorRole,
            AuditPeriod period, String q, int page);

    AuditLogView.Detail detail(long id);
}
