package com.lingualoop.backend.stats;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Arrays;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

/**
 * Khoảng thống kê (BR-TH-03): chỉ {@code 7d}, {@code 30d} (mặc định) hoặc {@code all}. "7 ngày" là hôm nay và 6 ngày
 * lịch trước đó theo múi giờ của học viên, không phải 168 giờ trượt.
 */
enum StatsRange {
    DAYS_7("7d", 7),
    DAYS_30("30d", 30),
    ALL("all", 0);

    private final String code;
    private final int days;

    StatsRange(String code, int days) {
        this.code = code;
        this.days = days;
    }

    String code() {
        return code;
    }

    /** Trống là {@code 30d}; giá trị lạ trả 400 thay vì lặng lẽ đổi sang mặc định. */
    static StatsRange parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return DAYS_30;
        }
        return Arrays.stream(values()).filter(r -> r.code.equals(raw.strip())).findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.VALIDATION_FAILED, "range phải là 7d, 30d hoặc all"));
    }

    /** Đầu ngày lịch đầu tiên của khoảng; {@code all} là từ đầu thời gian. */
    Instant since(LocalDate today, ZoneId zone) {
        return this == ALL ? Instant.EPOCH : today.minusDays(days - 1L).atStartOfDay(zone).toInstant();
    }
}
