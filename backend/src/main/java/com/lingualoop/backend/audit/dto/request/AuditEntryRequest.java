package com.lingualoop.backend.audit.dto.request;

import java.util.Map;
import java.util.UUID;

import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.security.Role;

/**
 * Một dòng nhật ký. {@code actorId} và {@code actorRole} cùng null nghĩa là "Hệ thống". {@code actorName},
 * {@code entityName}, {@code diff} và {@code note} là tuỳ chọn ngoài tên người thực hiện khi có người thực hiện.
 */
public record AuditEntryRequest(
        UUID actorId,
        String actorName,
        Role actorRole,
        AuditAction action,
        AuditEntityType entityType,
        UUID entityId,
        String entityName,
        Map<String, Object> diff,
        String note) {

    /** Dạng gọn không kèm tên và ghi chú; tên người thực hiện để trống thì ghi nhận là chưa rõ. */
    public AuditEntryRequest(UUID actorId, Role actorRole, AuditAction action, AuditEntityType entityType,
            UUID entityId, Map<String, Object> diff) {
        this(actorId, null, actorRole, action, entityType, entityId, null, diff, null);
    }
}
