package com.lingualoop.backend.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bind từ {@code app.shadowing.scoring}: ngưỡng của circuit breaker quanh lời gọi Azure. Đủ số lượt gọi tối thiểu
 * mà tỷ lệ lỗi vượt ngưỡng thì mạch mở, các lượt chấm sau trả lỗi ngay trong {@code openFor} thay vì chờ Azure.
 * {@code maxConcurrent}: số lời gọi Azure chạy cùng lúc; lời gọi thừa chờ tối đa {@code queueWait} rồi bị từ chối
 * với {@code SHADOWING_SCORING_BUSY} (gói Azure miễn phí có giới hạn số yêu cầu đồng thời).
 */
@ConfigurationProperties("app.shadowing.scoring")
public record ScoringGuardProperties(Integer windowSize, Integer minimumCalls, Integer failureRatePercent,
        Duration openFor, Integer maxConcurrent, Duration queueWait) {

    public ScoringGuardProperties {
        windowSize = windowSize == null ? 10 : windowSize;
        minimumCalls = minimumCalls == null ? 5 : minimumCalls;
        failureRatePercent = failureRatePercent == null ? 50 : failureRatePercent;
        openFor = openFor == null ? Duration.ofSeconds(30) : openFor;
        maxConcurrent = maxConcurrent == null ? 1 : maxConcurrent;
        queueWait = queueWait == null ? Duration.ofSeconds(5) : queueWait;
    }
}
