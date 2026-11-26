package com.lingualoop.backend.user.service;

import java.util.Map;
import java.util.UUID;

import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.user.dto.response.NotificationsResponse;

/** Thông báo trong ứng dụng của một người dùng (bảng {@code notifications}). */
public interface NotificationService {

    /** Thêm một thông báo chưa đọc; chạy trong giao dịch của nghiệp vụ đang gọi nếu có. */
    void send(UUID userId, String message);

    /**
     * Thêm một thông báo có loại, tham số và đường dẫn (BR-TK-22); {@code message} là câu tiếng Việt dự phòng. Có
     * {@code dedupeKey} thì mỗi người chỉ nhận một lần với khóa đó. Trả về {@code false} nếu bị bỏ vì trùng khóa hoặc vì
     * học viên đã tắt loại thông báo tùy chọn này (BR-TK-23).
     */
    boolean send(UUID userId, NotificationType type, String message, String link, Map<String, String> params,
            String dedupeKey);

    /**
     * Mỗi loại học viên tùy chọn được kèm trạng thái bật/tắt hiện tại (BR-TK-23), theo thứ tự khai báo; loại chưa chọn gì
     * là bật.
     */
    Map<NotificationType, Boolean> preferences(UUID userId);

    /** Bật hoặc tắt một loại thông báo tùy chọn; loại không tùy chọn được thì ném {@code VALIDATION_FAILED}. */
    void setPreference(UUID userId, NotificationType type, boolean enabled);

    /** {@code limit} thông báo mới nhất của người dùng, kèm tổng số chưa đọc. */
    NotificationsResponse latest(UUID userId, int limit);

    /** Một trang thông báo của người dùng từ mới đến cũ; {@code page} từ 0, {@code unreadOnly} chỉ lấy chưa đọc (BR-TK-18). */
    PageResponse<NotificationsResponse.Item> page(UUID userId, boolean unreadOnly, int page, int size);

    /** Đánh dấu đã đọc một thông báo của chính người dùng; không có ném {@code NOT_FOUND}. */
    void markRead(UUID userId, UUID notificationId);

    /** Đánh dấu đã đọc mọi thông báo của người dùng. */
    void markAllRead(UUID userId);
}
