package com.lingualoop.backend.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bind từ {@code app.shadowing.scoring}: ngưỡng của circuit breaker quanh lời gọi Azure. Đủ số lượt gọi tối thiểu
 * mà tỷ lệ lỗi vượt ngưỡng thì mạch mở, các lượt chấm sau trả lỗi ngay trong {@code openFor} thay vì chờ Azure.
 */
@ConfigurationProperties("app.shadowing.scoring")
public record ScoringGuardProperties(Integer windowSize, Integer minimumCalls, Integer failureRatePercent,
        Duration openFor) {

    public ScoringGuardProperties {
        windowSize = windowSize == null ? 10 : windowSize;
        minimumCalls = minimumCalls == null ? 5 : minimumCalls;
        failureRatePercent = failureRatePercent == null ? 50 : failureRatePercent;
        openFor = openFor == null ? Duration.ofSeconds(30) : openFor;
    }
}
