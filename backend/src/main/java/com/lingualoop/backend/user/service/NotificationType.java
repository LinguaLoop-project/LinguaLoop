package com.lingualoop.backend.user.service;

import java.util.Arrays;
import java.util.List;

/**
 * Loại thông báo gửi cho học viên (BR-TK-22). Giao diện dịch theo {@code notifications.types.<TÊN>} với các tham số đi kèm;
 * loại lạ hoặc thông báo không có loại thì hiện câu dự phòng đã lưu. Loại {@linkplain #configurable() tùy chọn} là nhắc
 * nhở học viên bật hoặc tắt được (BR-TK-23, mặc định bật); các loại còn lại luôn gửi vì liên quan tiền hoặc kết quả xử lý.
 */
public enum NotificationType {
    /** Thanh toán gói Pro thành công; tham số {@code endsAt}. */
    PRO_ACTIVATED(false),
    /** Thanh toán gói Pro thất bại. */
    PAYMENT_FAILED(false),
    /** Gói Pro sắp hết hạn; tham số {@code days}, {@code endsAt}. */
    PRO_EXPIRING(false),
    /** Gói Pro đã hết hạn. */
    PRO_EXPIRED(false),
    /** Báo cáo nội dung của học viên đã được xử lý (đã sửa nội dung). */
    REPORT_RESOLVED(false),
    /** Báo cáo nội dung của học viên không được chấp nhận; tham số {@code reason}. */
    REPORT_REJECTED(false),
    /** Có thẻ từ vựng đến hạn ôn; tham số {@code count}. */
    REVIEW_DUE(true),
    /** Chuỗi ngày học có nguy cơ đứt vì hôm nay chưa học; tham số {@code days}. */
    STREAK_AT_RISK(true),
    /** Hết credit AI nên một tính năng AI bị từ chối. */
    AI_CREDIT_EXHAUSTED(true);

    private final boolean configurable;

    NotificationType(boolean configurable) {
        this.configurable = configurable;
    }

    /** Học viên bật hoặc tắt được loại này. */
    public boolean configurable() {
        return configurable;
    }

    /** Các loại học viên tùy chọn được, theo thứ tự khai báo. */
    public static List<NotificationType> configurableTypes() {
        return Arrays.stream(values()).filter(NotificationType::configurable).toList();
    }
}
