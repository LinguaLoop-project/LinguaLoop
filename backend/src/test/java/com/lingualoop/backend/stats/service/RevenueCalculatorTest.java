package com.lingualoop.backend.stats.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.stats.repository.RevenueStatsRepository.PaidOrder;
import com.lingualoop.backend.stats.service.RevenueCalculator.Revenue;

/** Doanh thu, lãi gộp và tỷ suất theo BR-NK-06, 09 với đúng số liệu của AC-NK-21, AC-NK-24. */
class RevenueCalculatorTest {

    private static final Instant FROM = Instant.parse("2031-03-01T00:00:00Z");
    private static final BigDecimal FEE_3_PCT = BigDecimal.valueOf(3);

    @Test
    void revenue_monthlyOrdersInsideAndYearlyOrderSpanningWindow_AC_NK_21() {
        Instant to = FROM.plus(Duration.ofDays(30));
        List<PaidOrder> orders = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            orders.add(new PaidOrder(50_000, FROM, to));
        }
        Instant yearlyStart = FROM.minus(Duration.ofDays(100));
        orders.add(new PaidOrder(500_000, yearlyStart, yearlyStart.plus(Duration.ofDays(365))));

        Revenue revenue = RevenueCalculator.revenue(orders, FROM, to, FEE_3_PCT);
        BigDecimal cost = BigDecimal.valueOf(250_000);
        BigDecimal profit = RevenueCalculator.grossProfit(revenue.net(), cost);

        assertThat(RevenueCalculator.vnd(revenue.recognized())).isEqualByComparingTo("641096");
        assertThat(RevenueCalculator.vnd(revenue.net())).isEqualByComparingTo("621863");
        assertThat(RevenueCalculator.vnd(profit)).isEqualByComparingTo("371863");
        assertThat(RevenueCalculator.grossMarginPct(profit, revenue.net())).isEqualByComparingTo("59.8");
    }

    @Test
    void revenue_noAiUsageStillCountsOrders_AC_NK_24() {
        Instant to = FROM.plus(Duration.ofDays(7));
        PaidOrder monthly = new PaidOrder(50_000, FROM, FROM.plus(Duration.ofDays(30)));

        Revenue revenue = RevenueCalculator.revenue(List.of(monthly, monthly), FROM, to, FEE_3_PCT);
        BigDecimal profit = RevenueCalculator.grossProfit(revenue.net(), BigDecimal.ZERO);

        assertThat(RevenueCalculator.vnd(revenue.recognized())).isEqualByComparingTo("23333");
        assertThat(RevenueCalculator.vnd(revenue.net())).isEqualByComparingTo("22633");
        assertThat(RevenueCalculator.vnd(profit)).isEqualByComparingTo("22633");
    }

    @Test
    void revenue_orderOutsideWindow_contributesNothing() {
        Instant to = FROM.plus(Duration.ofDays(7));
        Instant before = FROM.minus(Duration.ofDays(60));
        PaidOrder ended = new PaidOrder(50_000, before, before.plus(Duration.ofDays(30)));

        Revenue revenue = RevenueCalculator.revenue(List.of(ended), FROM, to, FEE_3_PCT);

        assertThat(revenue.recognized()).isEqualByComparingTo("0");
    }

    @Test
    void grossMarginPct_zeroNetRevenue_isNotComputed() {
        assertThat(RevenueCalculator.grossMarginPct(BigDecimal.valueOf(-1000), BigDecimal.ZERO)).isNull();
    }
}
