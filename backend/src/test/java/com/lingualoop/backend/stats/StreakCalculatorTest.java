package com.lingualoop.backend.stats;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import java.util.HashSet;
import java.util.Set;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.stats.dto.StatsOverviewView.Streak;

/** Tính Chuỗi ngày học và Kỷ lục chuỗi (BR-TH-02). */
class StreakCalculatorTest {

    /** Thứ Tư. */
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 25);

    private static Set<LocalDate> days(int... daysAgo) {
        Set<LocalDate> out = new HashSet<>();
        for (int d : daysAgo) {
            out.add(TODAY.minusDays(d));
        }
        return out;
    }

    @Test
    void noDays_meansZeroEverywhere_AC_TH_05() {
        Streak s = StreakCalculator.compute(Set.of(), TODAY);

        assertThat(s.current()).isZero();
        assertThat(s.longest()).isZero();
        assertThat(s.studiedToday()).isFalse();
        assertThat(s.week()).containsOnly(false);
    }

    @Test
    void studyingToday_extendsTheRun_AC_TH_02() {
        Streak s = StreakCalculator.compute(days(0, 1, 2, 3, 4), TODAY);

        assertThat(s.current()).isEqualTo(5);
        assertThat(s.studiedToday()).isTrue();
    }

    @Test
    void notYetStudyingToday_keepsYesterdaysRun_AC_TH_23() {
        Streak s = StreakCalculator.compute(days(1, 2, 3, 4), TODAY);

        assertThat(s.current()).isEqualTo(4);
        assertThat(s.studiedToday()).isFalse();
    }

    @Test
    void aFullMissedDay_resetsTheRunButKeepsTheRecord_AC_TH_02() {
        // học 20..31 ngày trước (12 ngày), rồi bỏ trống; gần nhất là 3 ngày trước nên hôm qua trống
        Streak s = StreakCalculator.compute(days(3, 4, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31), TODAY);

        assertThat(s.current()).isZero();
        assertThat(s.longest()).isEqualTo(12);
    }

    @Test
    void theRecordNeverDropsBelowTheCurrentRun_AC_TH_02() {
        Streak s = StreakCalculator.compute(days(0, 1, 2, 10, 11), TODAY);

        assertThat(s.current()).isEqualTo(3);
        assertThat(s.longest()).isEqualTo(3);
    }

    @Test
    void weekRunsMondayToSunday_andMarksStudiedDays_AC_TH_02() {
        // hôm nay thứ Tư: thứ Hai (2 ngày trước) và thứ Tư (hôm nay) đã học, thứ Ba chưa
        Streak s = StreakCalculator.compute(days(0, 2), TODAY);

        assertThat(s.todayIndex()).isEqualTo(2);
        assertThat(s.week()).containsExactly(true, false, true, false, false, false, false);
    }

    @Test
    void daysBeforeThisWeek_doNotAppearInTheWeekStrip_AC_TH_02() {
        Streak s = StreakCalculator.compute(days(3, 4), TODAY);   // Chủ nhật và thứ Bảy tuần trước

        assertThat(s.week()).containsOnly(false);
    }
}
