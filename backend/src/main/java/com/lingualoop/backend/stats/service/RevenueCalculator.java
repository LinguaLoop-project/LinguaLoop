package com.lingualoop.backend.stats.service;

import java.math.BigDecimal;
import java.math.MathContext;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import com.lingualoop.backend.stats.repository.RevenueStatsRepository.PaidOrder;

/**
 * Doanh thu theo BR-NK-06, tính bằng Java thuần để kiểm được bằng unit test. Giữ đủ độ chính xác trong lúc tính, chỉ
 * làm tròn tới đồng khi trả kết quả.
 */
public final class RevenueCalculator {

    private static final MathContext MC = MathContext.DECIMAL64;
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private RevenueCalculator() {
    }

    /**
     * @param recognized doanh thu ghi nhận: giá đơn chia đều theo thời gian hiệu lực nằm trong khoảng
     * @param net        doanh thu ghi nhận × (1 − phí cổng thanh toán)
     */
    public record Revenue(BigDecimal recognized, BigDecimal net) {

        public static final Revenue ZERO = new Revenue(BigDecimal.ZERO, BigDecimal.ZERO);
    }

    /** Doanh thu chưa làm tròn của khoảng {@code [from, to)}. */
    public static Revenue revenue(List<PaidOrder> orders, Instant from, Instant to, BigDecimal gatewayFeePct) {
        BigDecimal recognized = BigDecimal.ZERO;
        for (PaidOrder order : orders) {
            recognized = recognized.add(recognizedPart(order, from, to));
        }
        BigDecimal keep = BigDecimal.ONE.subtract(gatewayFeePct.divide(HUNDRED, MC));
        return new Revenue(recognized, recognized.multiply(keep, MC));
    }

    /** Lãi gộp = doanh thu thuần − chi phí thực tế (BR-NK-09). */
    public static BigDecimal grossProfit(BigDecimal net, BigDecimal cost) {
        return net.subtract(cost);
    }

    /** Tỷ suất lãi gộp (%) = lãi gộp ÷ doanh thu thuần, 1 chữ số thập phân; doanh thu thuần bằng 0 thì không tính. */
    public static BigDecimal grossMarginPct(BigDecimal grossProfit, BigDecimal net) {
        if (net.signum() == 0) {
            return null;
        }
        return grossProfit.multiply(HUNDRED).divide(net, 1, RoundingMode.HALF_UP);
    }

    /** Làm tròn tới đồng. */
    public static BigDecimal vnd(BigDecimal value) {
        return value == null ? null : value.setScale(0, RoundingMode.HALF_UP);
    }

    private static BigDecimal recognizedPart(PaidOrder order, Instant from, Instant to) {
        long total = Duration.between(order.startsAt(), order.endsAt()).toSeconds();
        Instant start = order.startsAt().isAfter(from) ? order.startsAt() : from;
        Instant end = order.endsAt().isBefore(to) ? order.endsAt() : to;
        long inside = Duration.between(start, end).toSeconds();
        if (total <= 0 || inside <= 0) {
            return BigDecimal.ZERO;
        }
        return BigDecimal.valueOf(order.amountVnd()).multiply(BigDecimal.valueOf(inside))
                .divide(BigDecimal.valueOf(total), MC);
    }
}
