package com.lingualoop.backend.stats.service;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;

import com.lingualoop.backend.stats.dto.StatsPeriod;

/**
 * Khoảng thời gian của một lần xem thống kê (BR-NK-07): "N ngày gần nhất" là hôm nay và N − 1 ngày trước đó theo giờ
 * Việt Nam, tính từ 00:00 ngày đầu tới 00:00 ngày sau hôm nay (không gồm). Khoảng liền trước có cùng độ dài để tính
 * mức tăng giảm.
 *
 * @param from         đầu khoảng (gồm)
 * @param to           cuối khoảng (không gồm)
 * @param previousFrom đầu khoảng liền trước; cuối khoảng liền trước là {@code from}
 * @param firstDay     ngày đầu theo giờ Việt Nam
 * @param lastDay      hôm nay theo giờ Việt Nam
 */
public record StatsWindow(Instant from, Instant to, Instant previousFrom, LocalDate firstDay, LocalDate lastDay) {

    public static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    public static StatsWindow of(StatsPeriod period, Clock clock) {
        LocalDate today = LocalDate.ofInstant(clock.instant(), ZONE);
        LocalDate first = today.minusDays(period.days() - 1L);
        return new StatsWindow(startOf(first), startOf(today.plusDays(1)), startOf(first.minusDays(period.days())),
                first, today);
    }

    /** Đủ N ngày của khoảng, theo thứ tự tăng dần, để biểu đồ không bỏ ngày trống. */
    public List<LocalDate> days() {
        return firstDay.datesUntil(lastDay.plusDays(1)).toList();
    }

    private static Instant startOf(LocalDate day) {
        return day.atStartOfDay(ZONE).toInstant();
    }
}
