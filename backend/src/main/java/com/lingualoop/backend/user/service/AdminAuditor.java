package com.lingualoop.backend.user.service;

import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.audit.dto.AuditChanges;
import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditService;
import com.lingualoop.backend.security.Role;

import lombok.RequiredArgsConstructor;

/** Ghi nhật ký cho thao tác của quản trị viên trong feature {@code user} (UC-QT-02 đến 07). */
@Component
@RequiredArgsConstructor
class AdminAuditor {

    private final AuditService auditService;

    /** Tên quản trị viên do nhật ký tự tra lúc ghi (BR-NK-03). */
    void record(UUID adminId, AuditAction action, AuditEntityType entityType, UUID entityId, String entityName,
            Map<String, Object> diff, String note) {
        auditService.record(new AuditEntryRequest(adminId, null, Role.ADMIN, action, entityType, entityId,
                entityName, diff, note));
    }

    /** Một thay đổi trong {@code diff}: {@code {"old":..,"new":..}}; giữ được giá trị {@code null}. */
    static Map<String, Object> change(Object oldValue, Object newValue) {
        return AuditChanges.pair(oldValue, newValue);
    }
}
