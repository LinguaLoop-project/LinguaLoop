package com.lingualoop.backend.common.resilience;

import java.time.Duration;
import java.util.function.Predicate;
import java.util.function.Supplier;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import lombok.extern.slf4j.Slf4j;

/**
 * Circuit breaker dùng chung cho các lời gọi tới dịch vụ ngoài (Azure, Gemini). Mạch mở khi tỷ lệ lỗi trong cửa sổ
 * trượt vượt ngưỡng; trong lúc mở, lời gọi bị từ chối ngay thay vì chờ dịch vụ hết thời gian chờ.
 */
@Slf4j
public final class ExternalCallGuard {

    private final CircuitBreaker breaker;

    /**
     * @param isFailure lỗi nào tính là lỗi của dịch vụ (làm mở mạch); lỗi còn lại coi như dịch vụ vẫn trả lời bình thường
     */
    public ExternalCallGuard(String name, int windowSize, int minimumCalls, int failureRatePercent, Duration openFor,
            Predicate<Throwable> isFailure) {
        this.breaker = CircuitBreaker.of(name, CircuitBreakerConfig.custom()
                .slidingWindowSize(windowSize)
                .minimumNumberOfCalls(minimumCalls)
                .failureRateThreshold(failureRatePercent)
                .waitDurationInOpenState(openFor)
                .permittedNumberOfCallsInHalfOpenState(2)
                .automaticTransitionFromOpenToHalfOpenEnabled(false)
                .recordException(isFailure)
                .build());
        breaker.getEventPublisher().onStateTransition(
                event -> log.warn("Circuit breaker {}: {}", name, event.getStateTransition()));
    }

    /**
     * @param whenOpen lỗi ném ra khi mạch đang mở (không gọi tới dịch vụ)
     */
    public <T> T call(Supplier<T> action, Supplier<? extends RuntimeException> whenOpen) {
        try {
            return breaker.executeSupplier(action);
        } catch (CallNotPermittedException e) {
            log.warn("Circuit breaker {} đang mở, bỏ qua lời gọi", breaker.getName());
            throw whenOpen.get();
        }
    }

    public CircuitBreaker.State state() {
        return breaker.getState();
    }
}
