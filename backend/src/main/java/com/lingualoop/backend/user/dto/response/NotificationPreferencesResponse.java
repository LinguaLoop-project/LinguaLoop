package com.lingualoop.backend.user.dto.response;

import java.util.List;

/** Các loại thông báo tùy chọn của học viên kèm trạng thái bật/tắt (BR-TK-23). */
public record NotificationPreferencesResponse(List<Item> items) {

    /** {@code type} là tên loại, ví dụ {@code REVIEW_DUE}. */
    public record Item(String type, boolean enabled) {
    }
}
