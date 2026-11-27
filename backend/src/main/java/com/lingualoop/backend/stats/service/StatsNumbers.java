package com.lingualoop.backend.stats.service;

import java.math.BigDecimal;
import java.math.RoundingMode;

/** Cách làm tròn chung của các màn thống kê: điểm và tỷ lệ phần trăm đều 1 chữ số thập phân. */
final class StatsNumbers {

    private StatsNumbers() {
    }

    /** Điểm trung bình làm tròn 1 chữ số thập phân; trống khi không có lượt nào. */
    static BigDecimal score(BigDecimal avg) {
        return avg == null ? null : avg.setScale(1, RoundingMode.HALF_UP);
    }

    /** Tỷ lệ phần trăm 1 chữ số thập phân; mẫu bằng 0 thì trống. */
    static BigDecimal pct(long part, long whole) {
        return whole == 0 ? null
                : BigDecimal.valueOf(part * 100).divide(BigDecimal.valueOf(whole), 1, RoundingMode.HALF_UP);
    }
}
