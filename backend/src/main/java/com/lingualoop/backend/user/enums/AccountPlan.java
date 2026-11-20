package com.lingualoop.backend.user.enums;

import java.util.Locale;

/** Gói của học viên trên màn quản trị (UC-QT-01): Pro khi có đơn Pro còn hiệu lực, còn lại Free. */
public enum AccountPlan {
    FREE,
    PRO;

    /** Giá trị trên API ({@code free}, {@code pro}). */
    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static AccountPlan of(boolean pro) {
        return pro ? PRO : FREE;
    }
}
