package com.lingualoop.backend.user.enums;

import java.util.Locale;

/** Trạng thái tài khoản cho bộ lọc quản trị (UC-QT-01): suy ra từ {@code users.locked_at}. */
public enum AccountStatus {
    ACTIVE,
    LOCKED;

    /** Giá trị trên API ({@code active}, {@code locked}). */
    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }
}
