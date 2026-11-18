package com.lingualoop.backend.report.enums;

import java.util.Locale;
import java.util.Optional;

/** Bốn trạng thái của báo cáo (BR-XL-02); Đã xử lý và Từ chối là trạng thái kết thúc. */
public enum ReportStatus {
    WAITING_TEACHER,
    WAITING_ADMIN,
    RESOLVED,
    REJECTED;

    /** Giá trị lưu trong {@code content_reports.status}. */
    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    public boolean isOpen() {
        return this == WAITING_TEACHER || this == WAITING_ADMIN;
    }

    public static Optional<ReportStatus> fromValue(String value) {
        if (value == null) {
            return Optional.empty();
        }
        for (ReportStatus status : values()) {
            if (status.value().equalsIgnoreCase(value)) {
                return Optional.of(status);
            }
        }
        return Optional.empty();
    }
}
