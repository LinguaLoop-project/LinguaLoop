package com.lingualoop.backend.tutor;

import java.util.Locale;

/**
 * Kết quả phiên: lý do một Phiên gia sư kết thúc. Hiệu quả đo bằng Kết quả từng từ (WordStatus), không đo ở đây.
 */
public enum SessionOutcome {
    COMPLETED,
    LEARNER_EXIT,
    OFF_TOPIC,
    IDLE,
    TIMEOUT,
    CONNECT_FAILED;

    /** Đọc giá trị dạng "completed", "learner_exit"... từ frontend hoặc tool call. */
    public static SessionOutcome fromWire(String value) {
        if (value == null) {
            throw new IllegalArgumentException("outcome is required");
        }
        return valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}
