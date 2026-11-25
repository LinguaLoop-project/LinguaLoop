package com.lingualoop.backend.stats.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;

import org.junit.jupiter.api.Test;

/** Công thức của thống kê AI (BR-NK-09) với số liệu của AC-NK-21 và AC-NK-27. */
class AiEconomicsCalculatorTest {

    @Test
    void pricePerUnit_usesEveryCreditSpent_notOnlyPaidOnes_AC_NK_21() {
        // 6.000 credit cho 3.000 lần nhận xét, 1 credit = 25 đồng: 50 đồng mỗi lần nhận xét, dù 4.000 credit là dùng thử
        assertThat(AiEconomicsCalculator.pricePerUnit(6_000, 3_000, 25)).isEqualByComparingTo("50");
        assertThat(AiEconomicsCalculator.costPerUnit(BigDecimal.valueOf(90_000), 3_000)).isEqualByComparingTo("30");
    }

    @Test
    void pricePerUnit_dividesByUnitsNotCalls_AC_NK_27() {
        // 8 lần gợi ý gồm 9 câu, 9 credit: 25 đồng mỗi câu, không phải 28 đồng nếu chia cho 8 lần
        assertThat(AiEconomicsCalculator.pricePerUnit(9, 9, 25)).isEqualByComparingTo("25");
        assertThat(AiEconomicsCalculator.costPerUnit(BigDecimal.valueOf(18), 9)).isEqualByComparingTo("2");
    }

    @Test
    void isLoss_whenAverageCostIsHigher_AC_NK_27() {
        BigDecimal price = AiEconomicsCalculator.pricePerUnit(15, 3, 25);
        BigDecimal cost = AiEconomicsCalculator.costPerUnit(BigDecimal.valueOf(14_100), 3);

        assertThat(price).isEqualByComparingTo("125");
        assertThat(cost).isEqualByComparingTo("4700");
        assertThat(AiEconomicsCalculator.isLoss(price, cost)).isTrue();
        assertThat(AiEconomicsCalculator.isLoss(BigDecimal.valueOf(25), BigDecimal.valueOf(2))).isFalse();
    }

    @Test
    void isLoss_comparesUnroundedValues() {
        // 50,4 đồng so với 50,45 đồng: làm tròn thì bằng nhau nhưng chi phí vẫn cao hơn
        assertThat(AiEconomicsCalculator.isLoss(new BigDecimal("50.4"), new BigDecimal("50.45"))).isTrue();
    }

    @Test
    void perUnitValues_withoutUnits_areNotComputed() {
        assertThat(AiEconomicsCalculator.pricePerUnit(0, 0, 25)).isNull();
        assertThat(AiEconomicsCalculator.costPerUnit(BigDecimal.TEN, 0)).isNull();
        assertThat(AiEconomicsCalculator.isLoss(null, BigDecimal.TEN)).isFalse();
    }

    @Test
    void sharePct_isPartOverWhole() {
        assertThat(AiEconomicsCalculator.sharePct(BigDecimal.valueOf(13_711), BigDecimal.valueOf(14_233)))
                .isEqualByComparingTo("96.3");
        assertThat(AiEconomicsCalculator.sharePct(BigDecimal.ONE, BigDecimal.ZERO)).isNull();
    }
}
