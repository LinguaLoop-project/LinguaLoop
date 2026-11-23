package com.lingualoop.backend.config;

import java.time.Duration;
import java.time.ZoneId;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bind từ {@code app.credit}: {@code zone} dùng để tính mốc làm mới credit hằng tháng của gói Pro theo ngày ở Việt Nam
 * (BR-GA-10); {@code liveEstimate} là mức ước tính chi phí phiên giọng nói khi trình duyệt không báo số đơn vị xử lý
 * (BR-GA-12). Mức credit của từng tính năng nằm trong {@code ai_feature_prices} để quản trị viên sửa được (BR-GA-04,
 * ADR 0013).
 */
@ConfigurationProperties("app.credit")
public record CreditProperties(ZoneId zone, LiveEstimate liveEstimate) {

    public CreditProperties {
        zone = zone == null ? ZoneId.of("Asia/Ho_Chi_Minh") : zone;
        liveEstimate = liveEstimate == null ? new LiveEstimate(0, 0, null, null) : liveEstimate;
    }

    /**
     * @param inputUnitsPerSecond đơn vị xử lý đầu vào mỗi giây của phiên (âm thanh khoảng 32 mỗi giây)
     * @param outputUnitsPerSecond đơn vị xử lý đầu ra mỗi giây của phiên
     * @param reportGrace thời gian chờ trình duyệt báo số đơn vị xử lý sau khi phiên hết thời lượng tối đa
     * @param sweepInterval chu kỳ job ước tính các phiên không được báo
     */
    public record LiveEstimate(int inputUnitsPerSecond, int outputUnitsPerSecond, Duration reportGrace,
            Duration sweepInterval) {

        public LiveEstimate {
            inputUnitsPerSecond = inputUnitsPerSecond <= 0 ? 32 : inputUnitsPerSecond;
            outputUnitsPerSecond = outputUnitsPerSecond <= 0 ? 16 : outputUnitsPerSecond;
            reportGrace = reportGrace == null ? Duration.ofMinutes(5) : reportGrace;
            sweepInterval = sweepInterval == null ? Duration.ofMinutes(5) : sweepInterval;
        }
    }
}
