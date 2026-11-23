package com.lingualoop.backend.audit.enums;

import java.util.Locale;
import java.util.Optional;

/** Thao tác trên nội dung và tài khoản */
public enum AuditAction {
    CREATE,
    UPDATE,
    DELETE,
    PUBLISH,
    UNPUBLISH,
    RESOLVE,
    REJECT,
    RESTORE,
    LOCK,
    UNLOCK,
    CHANGE_ROLE,
    TRANSFER,
    /** Quản trị viên cấp credit cho giáo viên (UC-GA-07). */
    GRANT_CREDIT;

    /** Giá trị lưu trong DB. */
    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static Optional<AuditAction> fromValue(String value) {
        if (value == null) {
            return Optional.empty();
        }
        for (AuditAction action : values()) {
            if (action.value().equalsIgnoreCase(value)) {
                return Optional.of(action);
            }
        }
        return Optional.empty();
    }
}
