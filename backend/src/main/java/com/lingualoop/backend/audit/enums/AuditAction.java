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
    GRANT_CREDIT,
    /** Nhập nhiều thẻ từ tệp: một mục cho cả lần nhập (UC-NT-07, BR-NT-10). */
    IMPORT,
    /** Đặt lại mật khẩu qua liên kết (UC-TK-06, BR-TK-18). */
    PASSWORD_RESET,
    /** Tạo hoặc đổi mật khẩu (UC-TK-07, BR-TK-18). */
    PASSWORD_CHANGE,
    /** Tạm khóa đăng nhập vì sai mật khẩu nhiều lần (BR-TK-03, BR-TK-18). */
    LOGIN_LOCKED;

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
