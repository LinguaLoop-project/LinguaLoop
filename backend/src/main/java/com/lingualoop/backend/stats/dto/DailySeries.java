package com.lingualoop.backend.stats.dto;

import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/**
 * Số liệu theo ngày cho biểu đồ: đủ mọi ngày của khoảng (ngày không có dữ liệu là 0, BR-NK-07), mỗi chuỗi cùng độ dài
 * với {@code days}.
 */
public record DailySeries(List<LocalDate> days, Map<String, List<Long>> series) {

    public DailySeries {
        days = List.copyOf(days);
        Map<String, List<Long>> copy = new LinkedHashMap<>();
        series.forEach((name, values) -> copy.put(name, List.copyOf(values)));
        series = copy;
    }

    /** Dựng chuỗi từ số liệu thưa theo ngày: ngày vắng mặt thành 0. */
    public static DailySeries of(List<LocalDate> days, Map<String, Map<LocalDate, Long>> sparse) {
        Map<String, List<Long>> series = new LinkedHashMap<>();
        sparse.forEach((name, byDay) -> series.put(name,
                days.stream().map(day -> byDay.getOrDefault(day, 0L)).toList()));
        return new DailySeries(days, series);
    }
}
