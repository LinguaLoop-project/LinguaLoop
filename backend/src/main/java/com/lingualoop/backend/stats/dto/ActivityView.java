package com.lingualoop.backend.stats.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Lịch nhiệt các ngày học (BR-TH-15): 90 ngày gần nhất tính cả hôm nay; {@code from} là thứ Hai của tuần chứa ngày đầu tiên để lưới xếp theo
 * tuần (các ô trước ngày đầu tiên không có dữ liệu). Chỉ liệt kê ngày có hoạt động; giao diện tự điền các ngày còn lại là 0.
 */
public record ActivityView(LocalDate from, LocalDate to, List<Day> days) {

    public ActivityView {
        days = List.copyOf(days);
    }

    /** @param count số hoạt động trong ngày: lượt luyện câu, câu trả lời thẻ và phiên AI đã hoàn thành */
    public record Day(LocalDate date, long count) {
    }
}
