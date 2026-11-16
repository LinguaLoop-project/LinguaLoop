package com.lingualoop.backend.user.dto.response;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Thông báo mới nhất của người dùng cho chuông trên thanh trên, kèm số chưa đọc. */
public record NotificationsResponse(List<Item> items, long unreadCount) {

    /** Một thông báo; {@code read} là đã đọc. */
    public record Item(UUID id, String message, boolean read, Instant createdAt) {
    }
}
