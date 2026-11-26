package com.lingualoop.backend.stats.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Thống kê sử dụng AI và chi phí (UC-NK-04, BR-NK-09, 14, 15). Số tiền tính bằng đồng, đã làm tròn. */
public record AiUsageStatsView(
        Instant computedAt,
        StatsPeriod period,
        int creditValueVnd,
        List<FeatureUsage> features,
        Totals totals,
        DailySeries creditsByFeature,
        List<TopAccount> topAccounts) {

    public AiUsageStatsView {
        features = List.copyOf(features);
        topAccounts = List.copyOf(topAccounts);
    }

    /**
     * Lãi lỗ của một tính năng tính credit (BR-NK-09). Lần dùng là lần thành công; số đơn vị là tổng đơn vị tính credit
     * (câu, phiên, bài...) của các lần đó. Giá bán và chi phí bình quân mỗi đơn vị (đồng) trống khi chưa có lần dùng;
     * {@code loss} là dấu "Lỗ" (chi phí bình quân lớn hơn giá bán), so trên số chưa làm tròn.
     */
    public record FeatureUsage(
            String feature,
            long uses,
            long units,
            long credits,
            BigDecimal costVnd,
            BigDecimal pricePerUnitVnd,
            BigDecimal costPerUnitVnd,
            boolean loss) {
    }

    /**
     * Phần tổng (BR-NK-06, 09, 14): doanh thu thuần, chi phí thực tế kèm phần dùng thử của học viên Free, lãi gộp.
     * {@code trialCostPct} và {@code grossMarginPct} trống khi chi phí, doanh thu thuần bằng 0.
     */
    public record Totals(
            BigDecimal netRevenueVnd,
            BigDecimal costVnd,
            BigDecimal trialCostVnd,
            BigDecimal trialCostPct,
            BigDecimal grossProfitVnd,
            BigDecimal grossMarginPct) {
    }

    /** Tài khoản tiêu nhiều credit nhất trong khoảng. */
    public record TopAccount(UUID userId, String name, String email, String plan, long credits, BigDecimal costVnd) {
    }
}
