package com.lingualoop.backend.user.dto.response;

import java.time.Instant;
import java.util.Map;
import java.util.List;
import java.util.UUID;

/** Thông báo mới nhất của người dùng cho chuông trên thanh trên, kèm số chưa đọc. */
public record NotificationsResponse(List<Item> items, long unreadCount) {

    /**
     * Một thông báo; {@code read} là đã đọc. {@code type}, {@code params}, {@code link} để giao diện dịch và dẫn tới trang
     * liên quan; thông báo cũ không có loại thì chỉ có {@code message} (BR-TK-22).
     */
    public record Item(UUID id, String message, boolean read, Instant createdAt, String type, Map<String, String> params,
            String link) {
    }
}
