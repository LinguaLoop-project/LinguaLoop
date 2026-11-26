package com.lingualoop.backend.audit.dto.request;

import java.util.Map;
import java.util.UUID;

import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.security.Role;

/**
 * Một dòng nhật ký. {@code actorId} và {@code actorRole} cùng null nghĩa là "Hệ thống". {@code actorName} để trống thì
 * nhật ký tự tra tên hiển thị của {@code actorId}. {@code entityName}, {@code diff} và {@code note} là tuỳ chọn.
 * {@code parentType}/{@code parentId} là bài học hoặc bộ thẻ chứa nội dung bị báo cáo (BR-NK-03, BR-NK-17); dùng
 * {@link #withParent}. Nội dung từng cột theo BR-NK-03.
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
        String note,
        AuditEntityType parentType,
        UUID parentId) {

    public AuditEntryRequest {
        if ((parentType == null) != (parentId == null)) {
            throw new IllegalArgumentException("parentType và parentId phải cùng có hoặc cùng trống");
        }
    }

    /** Dạng không có đối tượng chứa. */
    public AuditEntryRequest(UUID actorId, String actorName, Role actorRole, AuditAction action,
            AuditEntityType entityType, UUID entityId, String entityName, Map<String, Object> diff, String note) {
        this(actorId, actorName, actorRole, action, entityType, entityId, entityName, diff, note, null, null);
    }

    /** Bản sao gắn đối tượng chứa: bài học hoặc bộ thẻ của nội dung bị báo cáo. */
    public AuditEntryRequest withParent(AuditEntityType type, UUID id) {
        return new AuditEntryRequest(actorId, actorName, actorRole, action, entityType, entityId, entityName, diff, note,
                type, id);
    }
}
