package com.lingualoop.backend.stats.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.stats.dto.Metric;
import com.lingualoop.backend.stats.dto.StatsPeriod;

/** Khoảng thời gian theo giờ Việt Nam và mức tăng giảm (BR-NK-07). */
class StatsWindowTest {

    @Test
    void sevenDays_endsTodayInVietnam_andHasEveryDay_AC_NK_15() {
        // 20:00 ngày 15/11 giờ quốc tế = 03:00 ngày 16/11 giờ Việt Nam: "hôm nay" là 16/11
        Clock clock = Clock.fixed(Instant.parse("2031-11-15T20:00:00Z"), ZoneOffset.UTC);

        StatsWindow w = StatsWindow.of(StatsPeriod.D7, clock);

        assertThat(w.firstDay()).isEqualTo(LocalDate.of(2031, 11, 10));
        assertThat(w.lastDay()).isEqualTo(LocalDate.of(2031, 11, 16));
        assertThat(w.from()).isEqualTo(Instant.parse("2031-11-09T17:00:00Z"));
        assertThat(w.to()).isEqualTo(Instant.parse("2031-11-16T17:00:00Z"));
        assertThat(w.previousFrom()).isEqualTo(Instant.parse("2031-11-02T17:00:00Z"));
        assertThat(w.days()).hasSize(7).first().isEqualTo(LocalDate.of(2031, 11, 10));
    }

    @Test
    void metric_changeIsRelativeToPreviousPeriod_AC_NK_09() {
        assertThat(Metric.of(60, 40).changePct()).isEqualByComparingTo("50.0");
        assertThat(Metric.of(3, 2).changePct()).isEqualByComparingTo("50.0");
        assertThat(Metric.of(5, 0).changePct()).isNull();
    }
}
