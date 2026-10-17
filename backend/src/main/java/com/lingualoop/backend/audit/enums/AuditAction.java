package com.lingualoop.backend.audit.enums;

import java.util.Locale;
import java.util.Optional;

/** Thao tác trên nội dung */
public enum AuditAction {
    CREATE,
    UPDATE,
    DELETE,
    PUBLISH,
    UNPUBLISH;

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
