package com.lingualoop.backend.stats;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

/** Khoảng thống kê (BR-TH-03). */
class StatsRangeTest {

    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");
    private static final LocalDate TODAY = LocalDate.of(2026, 11, 25);

    @Test
    void blankDefaultsTo30Days_AC_TH_01() {
        assertThat(StatsRange.parse(null)).isEqualTo(StatsRange.DAYS_30);
        assertThat(StatsRange.parse(" ")).isEqualTo(StatsRange.DAYS_30);
    }

    @Test
    void acceptsOnlyThe3Values_AC_TH_03() {
        assertThat(StatsRange.parse("7d")).isEqualTo(StatsRange.DAYS_7);
        assertThat(StatsRange.parse("30d")).isEqualTo(StatsRange.DAYS_30);
        assertThat(StatsRange.parse("all")).isEqualTo(StatsRange.ALL);
        for (String bad : new String[] {"1d", "7", "week", "ALL", "30D"}) {
            assertThatThrownBy(() -> StatsRange.parse(bad)).isInstanceOfSatisfying(BusinessException.class,
                    e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.VALIDATION_FAILED));
        }
    }

    @Test
    void sevenDaysIsTodayAndThe6CalendarDaysBefore_AC_TH_03() {
        Instant since = StatsRange.DAYS_7.since(TODAY, ZONE);

        assertThat(since).isEqualTo(LocalDate.of(2026, 11, 19).atStartOfDay(ZONE).toInstant());
    }

    @Test
    void thirtyDaysIsTodayAndThe29CalendarDaysBefore_AC_TH_03() {
        assertThat(StatsRange.DAYS_30.since(TODAY, ZONE))
                .isEqualTo(LocalDate.of(2026, 10, 27).atStartOfDay(ZONE).toInstant());
    }

    @Test
    void allStartsAtTheBeginningOfTime_AC_TH_03() {
        assertThat(StatsRange.ALL.since(TODAY, ZONE)).isEqualTo(Instant.EPOCH);
    }

    @Test
    void previousPeriodIsTheSameNumberOfCalendarDaysRightBeforeTheRange_AC_TH_27() {
        // 7 ngày: 19/11 đến 25/11, khoảng liền trước: 12/11 đến 18/11
        assertThat(StatsRange.DAYS_7.previousSince(TODAY, ZONE))
                .isEqualTo(LocalDate.of(2026, 11, 12).atStartOfDay(ZONE).toInstant());
        assertThat(StatsRange.DAYS_30.previousSince(TODAY, ZONE))
                .isEqualTo(LocalDate.of(2026, 9, 27).atStartOfDay(ZONE).toInstant());
    }

    @Test
    void allHasNoPreviousPeriod_AC_TH_27() {
        assertThat(StatsRange.ALL.previousSince(TODAY, ZONE)).isNull();
    }
}
