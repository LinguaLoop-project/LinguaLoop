package com.lingualoop.backend.subscription.enums;

/** Loại đơn đăng ký (BR-PR-05); giá trị khớp cột {@code pro_orders.kind}. */
public enum OrderKind {
    /** Học viên thường nâng cấp lên Pro (UC-PR-02). */
    upgrade,
    /** Học viên pro gia hạn nối tiếp (UC-PR-04). */
    renew
}
