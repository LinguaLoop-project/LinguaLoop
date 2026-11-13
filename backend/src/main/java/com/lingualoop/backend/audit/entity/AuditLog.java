package com.lingualoop.backend.audit.entity;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;

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

/**
 * Nhật ký chung cho nội dung, quản trị và báo cáo. {@code actorId} null là "Hệ thống" (vd tự chuyển báo cáo), khi đó
 * {@code actorRole} là {@code system}. Tên người thực hiện và tên đối tượng được chép lại lúc ghi để nhật ký vẫn đọc
 * được sau khi đối tượng bị xoá.
 */
@Getter
@Entity
@Table(name = "audit_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AuditLog {

    /** Vai trò ghi khi không có người thực hiện. */
    public static final String SYSTEM_ROLE = "system";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "actor_id", updatable = false)
    private UUID actorId;

    @Column(name = "actor_name", nullable = false, updatable = false)
    private String actorName;

    /** {@code student}, {@code teacher}, {@code admin} hoặc {@code system}. */
    @Column(name = "actor_role", nullable = false, updatable = false)
    private String actorRole;

    @Convert(converter = AuditActionConverter.class)
    @Column(name = "action", nullable = false, updatable = false)
    private AuditAction action;

    @Convert(converter = AuditEntityTypeConverter.class)
    @Column(name = "target_type", nullable = false, updatable = false)
    private AuditEntityType targetType;

    @Column(name = "target_id", updatable = false)
    private UUID targetId;

    @Column(name = "target_name", updatable = false)
    private String targetName;

    /** {"field":{"old":..,"new":..}} */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "changes", updatable = false)
    private Map<String, Object> changes;

    @Column(name = "note", updatable = false)
    private String note;

    @Column(name = "created_at", nullable = false, insertable = false, updatable = false)
    private Instant createdAt;

    public static AuditLog of(UUID actorId, String actorName, String actorRole, AuditAction action,
            AuditEntityType targetType, UUID targetId, String targetName, Map<String, Object> changes, String note) {
        AuditLog log = new AuditLog();
        log.actorId = actorId;
        log.actorName = actorName;
        log.actorRole = actorRole;
        log.action = action;
        log.targetType = targetType;
        log.targetId = targetId;
        log.targetName = targetName;
        log.changes = changes;
        log.note = note;
        return log;
    }
}
