package com.lingualoop.backend.stats.service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;

/** Công thức của thống kê AI (BR-NK-09), tính bằng Java thuần để kiểm được bằng unit test. */
public final class AiEconomicsCalculator {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final MathContext MC = MathContext.DECIMAL64;

    private AiEconomicsCalculator() {
    }

    /**
     * Giá bán bình quân mỗi đơn vị tính credit (đồng) = credit đã tiêu ÷ số đơn vị × giá trị 1 credit; chưa có đơn vị
     * nào thì trống. Chưa làm tròn, để so với chi phí cho đúng.
     */
    public static BigDecimal pricePerUnit(long credits, long units, int creditValueVnd) {
        if (units == 0) {
            return null;
        }
        return BigDecimal.valueOf(credits).multiply(BigDecimal.valueOf(creditValueVnd))
                .divide(BigDecimal.valueOf(units), MC);
    }

    /** Chi phí bình quân mỗi đơn vị (đồng) = chi phí thực tế ÷ số đơn vị; chưa có đơn vị nào thì trống. */
    public static BigDecimal costPerUnit(BigDecimal costVnd, long units) {
        if (units == 0) {
            return null;
        }
        return costVnd.divide(BigDecimal.valueOf(units), MC);
    }

    /** Dấu "Lỗ": chi phí bình quân lớn hơn giá bán bình quân, không xét người dùng là ai. */
    public static boolean isLoss(BigDecimal pricePerUnit, BigDecimal costPerUnit) {
        return pricePerUnit != null && costPerUnit != null && costPerUnit.compareTo(pricePerUnit) > 0;
    }

    /** Phần trăm của {@code part} trên {@code whole}, 1 chữ số thập phân; {@code whole} bằng 0 thì trống. */
    public static BigDecimal sharePct(BigDecimal part, BigDecimal whole) {
        if (whole.signum() == 0) {
            return null;
        }
        return part.multiply(HUNDRED).divide(whole, 1, RoundingMode.HALF_UP);
    }

}
