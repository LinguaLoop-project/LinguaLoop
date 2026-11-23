package com.lingualoop.backend.stats.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Lịch nhiệt các ngày học (BR-TH-15): từ thứ Hai của tuần cách đây 12 tuần đến hôm nay, tức 13 tuần. Chỉ liệt kê ngày
 * có hoạt động; giao diện tự điền các ngày còn lại là 0.
 */
public record ActivityView(LocalDate from, LocalDate to, List<Day> days) {

    public ActivityView {
        days = List.copyOf(days);
    }

    /** @param count số hoạt động trong ngày: lượt luyện câu, câu trả lời thẻ và phiên AI đã hoàn thành */
    public record Day(LocalDate date, long count) {
    }
}
