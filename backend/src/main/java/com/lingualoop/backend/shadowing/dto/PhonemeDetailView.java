package com.lingualoop.backend.shadowing.dto;

import java.time.LocalDate;
import java.util.List;

/**
 * Chi tiết một âm vị cho học viên (BR-TH-10).
 *
 * @param stat         số lần gặp và lỗi trong khoảng đang chọn
 * @param confusedAs   âm khác âm đích mà học viên hay đọc nhầm thành nhất, null nếu không có
 * @param mostlyOmitted phần lớn lần lỗi không nghe ra âm nào (hay bỏ sót âm)
 * @param tip          mẹo sửa phát âm tiếng Việt, null nếu âm chưa có mẹo
 * @param weeklyTrend  tỷ lệ lỗi theo tuần có dữ liệu trong 8 tuần gần nhất, từ cũ đến mới
 */
public record PhonemeDetailView(PhonemeStatView stat, String confusedAs, boolean mostlyOmitted, String tip,
        List<WeekPoint> weeklyTrend) {

    public PhonemeDetailView {
        weeklyTrend = List.copyOf(weeklyTrend);
    }

    /** Một tuần của biểu đồ xu hướng; {@code weekStart} là thứ Hai của tuần. */
    public record WeekPoint(LocalDate weekStart, long total, long errors) {
    }
}
