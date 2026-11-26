package com.lingualoop.backend.stats.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Một chỉ số kèm giá trị của khoảng liền trước và mức tăng giảm theo phần trăm (BR-NK-07). {@code current} hoặc
 * {@code previous} trống khi không tính được (vd điểm trung bình khi không có lượt nào); {@code changePct} trống khi
 * kỳ trước bằng 0 hoặc trống.
 */
public record Metric(BigDecimal current, BigDecimal previous, BigDecimal changePct) {

    public static Metric of(long current, long previous) {
        return of(BigDecimal.valueOf(current), BigDecimal.valueOf(previous));
    }

    public static Metric of(BigDecimal current, BigDecimal previous) {
        return new Metric(current, previous, changePct(current, previous));
    }

    /** (hiện tại − kỳ trước) ÷ kỳ trước × 100, làm tròn 1 chữ số thập phân. */
    static BigDecimal changePct(BigDecimal current, BigDecimal previous) {
        if (current == null || previous == null || previous.signum() == 0) {
            return null;
        }
        return current.subtract(previous).multiply(BigDecimal.valueOf(100))
                .divide(previous, 1, RoundingMode.HALF_UP);
    }
}
