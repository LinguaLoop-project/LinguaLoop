package com.lingualoop.backend.user.enums;

import java.util.Locale;

import com.lingualoop.backend.audit.enums.AuditEntityType;

/** Loại nội dung quản trị viên giao lại (UC-QT-05, 06, 07). */
public enum TransferContentType {
    LESSON(AuditEntityType.LESSON),
    DECK(AuditEntityType.DECK);

    private final AuditEntityType auditEntityType;

    TransferContentType(AuditEntityType auditEntityType) {
        this.auditEntityType = auditEntityType;
    }

    /** Giá trị trên API và trong truy vấn ({@code lesson}, {@code deck}). */
    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    public AuditEntityType auditEntityType() {
        return auditEntityType;
    }

    /** {@code value} đã được kiểm bằng {@code @Pattern} ở request. */
    public static TransferContentType fromValue(String value) {
        return valueOf(value.toUpperCase(Locale.ROOT));
    }
}
