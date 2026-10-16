package com.lingualoop.backend.audit.dto.request;

import java.util.Map;
import java.util.UUID;

import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.security.Role;


public record AuditEntryRequest(
        UUID actorId,
        Role actorRole,
        AuditAction action,
        AuditEntityType entityType,
        UUID entityId,
        Map<String, Object> diff) {
}
