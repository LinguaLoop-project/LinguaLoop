package com.lingualoop.backend.security;

import java.util.Locale;
import java.util.Optional;

/** Vai trò người dùng, khớp CHECK của cột {@code users.role} ('student', 'instructor', 'admin'). */
public enum Role {
    STUDENT,
    INSTRUCTOR,
    ADMIN;

    /** Giá trị lưu trong DB và trong claim {@code role} của JWT. */
    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    /** Tên authority Spring Security, dùng với {@code hasRole("ADMIN")}. */
    public String authority() {
        return "ROLE_" + name();
    }

    public static Optional<Role> fromValue(String value) {
        if (value == null) {
            return Optional.empty();
        }
        for (Role role : values()) {
            if (role.value().equalsIgnoreCase(value)) {
                return Optional.of(role);
            }
        }
        return Optional.empty();
    }
}
