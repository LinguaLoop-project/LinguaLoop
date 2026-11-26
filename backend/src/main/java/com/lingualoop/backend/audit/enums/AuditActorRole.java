package com.lingualoop.backend.audit.enums;

import java.util.Locale;

/** Vai trò người thực hiện dùng để lọc nhật ký (BR-NK-04), gồm cả "Hệ thống". */
public enum AuditActorRole {
    STUDENT,
    TEACHER,
    ADMIN,
    SYSTEM;

    /** Giá trị lưu ở cột {@code actor_role}. */
    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }
}
