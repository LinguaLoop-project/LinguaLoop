package com.lingualoop.backend.stats;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

import com.lingualoop.backend.stats.dto.StatsOverviewView.Streak;

/**
 * Tính Chuỗi ngày học và Kỷ lục chuỗi từ tập Ngày đã học (BR-TH-02). Hôm nay chưa học thì chuỗi vẫn giữ theo hôm qua; chỉ
 * khi trọn một ngày trôi qua mà không học thì chuỗi về 0, còn kỷ lục không bao giờ giảm.
 */
final class StreakCalculator {

    private StreakCalculator() {
    }

    /** @param days ngày đã học theo múi giờ của học viên; @param today hôm nay theo múi giờ đó */
    static Streak compute(Set<LocalDate> days, LocalDate today) {
        boolean studiedToday = days.contains(today);

        int current = 0;
        for (LocalDate d = studiedToday ? today : today.minusDays(1); days.contains(d); d = d.minusDays(1)) {
            current++;
        }

        int longest = 0;
        int run = 0;
        LocalDate previous = null;
        for (LocalDate d : new TreeSet<>(days)) {
            run = previous != null && previous.plusDays(1).equals(d) ? run + 1 : 1;
            longest = Math.max(longest, run);
            previous = d;
        }

        LocalDate monday = today.with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<Boolean> week = new ArrayList<>(7);
        for (int i = 0; i < 7; i++) {
            week.add(days.contains(monday.plusDays(i)));
        }
        return new Streak(current, Math.max(longest, current), studiedToday, week, today.getDayOfWeek().getValue() - 1);
    }
}
