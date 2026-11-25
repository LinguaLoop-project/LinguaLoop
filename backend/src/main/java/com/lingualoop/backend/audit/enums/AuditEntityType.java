package com.lingualoop.backend.audit.enums;

import java.util.Locale;
import java.util.Optional;

/**
 * Loại đối tượng của một mục nhật ký (BR-NK-18). Thêm loại mới cùng lúc với dòng tương ứng trong
 * ma trận ghi nhật ký (BR-NK-18).
 */
public enum AuditEntityType {
    LESSON,
    DECK,
    /** Chỉ để đọc mục cũ: câu, nhóm thẻ, thẻ không còn được ghi nhật ký (BR-NK-18). */
    SENTENCE,
    /** Chỉ để đọc mục cũ, xem {@link #SENTENCE}. */
    GROUP,
    /** Chỉ để đọc mục cũ, xem {@link #SENTENCE}. */
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
