package com.lingualoop.backend.user.service;

import java.util.UUID;

import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.user.dto.response.NotificationsResponse;

/** Thông báo trong ứng dụng của một người dùng (bảng {@code notifications}). */
public interface NotificationService {

    /** Thêm một thông báo chưa đọc; chạy trong giao dịch của nghiệp vụ đang gọi nếu có. */
    void send(UUID userId, String message);

    /** {@code limit} thông báo mới nhất của người dùng, kèm tổng số chưa đọc. */
    NotificationsResponse latest(UUID userId, int limit);

    /** Một trang thông báo của người dùng từ mới đến cũ; {@code page} từ 0, {@code unreadOnly} chỉ lấy chưa đọc (BR-TK-18). */
    PageResponse<NotificationsResponse.Item> page(UUID userId, boolean unreadOnly, int page, int size);

    /** Đánh dấu đã đọc một thông báo của chính người dùng; không có ném {@code NOT_FOUND}. */
    void markRead(UUID userId, UUID notificationId);

    /** Đánh dấu đã đọc mọi thông báo của người dùng. */
    void markAllRead(UUID userId);
}
