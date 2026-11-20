package com.lingualoop.backend.user.service;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.entity.User;
import com.lingualoop.backend.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

/** Ghi nhật ký cho thao tác của quản trị viên trong feature {@code user} (UC-QT-02 đến 07). */
@Component
@RequiredArgsConstructor
class AdminAuditor {

    private final UserRepository users;
    private final AuditService auditService;

    void record(UUID adminId, AuditAction action, AuditEntityType entityType, UUID entityId, String entityName,
            Map<String, Object> diff, String note) {
        // findById trong cùng giao dịch lấy từ persistence context sau lần đầu, không truy vấn lại.
        String adminName = users.findById(adminId).map(User::getDisplayName).orElse(null);
        auditService.record(new AuditEntryRequest(adminId, adminName, Role.ADMIN, action, entityType, entityId,
                entityName, diff, note));
    }

    /** Một thay đổi trong {@code diff}: {@code {"old":..,"new":..}}; giữ được giá trị {@code null}. */
    static Map<String, Object> change(Object oldValue, Object newValue) {
        Map<String, Object> change = new LinkedHashMap<>();
        change.put("old", oldValue);
        change.put("new", newValue);
        return change;
    }
}
