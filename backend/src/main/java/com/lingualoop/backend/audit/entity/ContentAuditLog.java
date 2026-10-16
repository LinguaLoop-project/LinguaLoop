package com.lingualoop.backend.audit.entity;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.security.Role;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;


@Getter
@Entity
@Table(name = "content_audit_log")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class ContentAuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id", updatable = false)
    private UUID actorId;

    @Convert(converter = AuditActorRoleConverter.class)
    @Column(name = "actor_role", nullable = false, updatable = false)
    private Role actorRole;

    @Convert(converter = AuditActionConverter.class)
    @Column(nullable = false, updatable = false)
    private AuditAction action;

    @Convert(converter = AuditEntityTypeConverter.class)
    @Column(name = "entity_type", nullable = false, updatable = false)
    private AuditEntityType entityType;

    @Column(name = "entity_id", nullable = false, updatable = false)
    private UUID entityId;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(updatable = false)
    private Map<String, Object> diff;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    public static ContentAuditLog of(UUID actorId, Role actorRole, AuditAction action, AuditEntityType entityType,
            UUID entityId, Map<String, Object> diff) {
        ContentAuditLog log = new ContentAuditLog();
        log.actorId = actorId;
        log.actorRole = actorRole;
        log.action = action;
        log.entityType = entityType;
        log.entityId = entityId;
        log.diff = diff;
        return log;
    }
}
