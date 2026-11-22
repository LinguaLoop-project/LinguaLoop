package com.lingualoop.backend.audit.enums;

import java.util.Locale;
import java.util.Optional;

/** Loại nội dung được ghi nhật ký; thêm dần khi feature mới. */
public enum AuditEntityType {
    TOPIC,
    LESSON,
    SENTENCE,
    DECK,
    CARD,
    REPORT,
    USER,
    /** Cấu hình credit (UC-GA-02). */
    SETTINGS,
    /** Gói Pro (UC-GA-04 đến 06). */
    PLAN;

    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static Optional<AuditEntityType> fromValue(String value) {
        if (value == null) {
            return Optional.empty();
        }
        for (AuditEntityType type : values()) {
            if (type.value().equalsIgnoreCase(value)) {
                return Optional.of(type);
            }
        }
        return Optional.empty();
    }
}
