package com.lingualoop.backend.shadowing.azure;

import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.ScoringGuardProperties;

import io.github.resilience4j.circuitbreaker.CallNotPermittedException;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerConfig;
import lombok.extern.slf4j.Slf4j;

/**
 * Bọc dịch vụ chấm bằng circuit breaker. Azure chậm hoặc sập thì sau vài lượt lỗi mạch mở: các lượt chấm tiếp theo
 * báo {@code SHADOWING_SCORING_UNAVAILABLE} ngay (và được hoàn lượt như mọi lỗi chấm khác) thay vì mỗi người học
 * phải chờ hết thời gian chờ của Azure. Lỗi do người học (không nghe thấy lời nói) không tính là lỗi dịch vụ.
 */
@Slf4j
@Primary
@Service
class GuardedPronunciationScoringService implements PronunciationScoringService {

    private final PronunciationScoringService delegate;
    private final CircuitBreaker breaker;

    GuardedPronunciationScoringService(
            @Qualifier("azurePronunciationScoringService") PronunciationScoringService delegate,
            ScoringGuardProperties properties) {
        this.delegate = delegate;
        this.breaker = CircuitBreaker.of("azure-scoring", CircuitBreakerConfig.custom()
                .slidingWindowSize(properties.windowSize())
                .minimumNumberOfCalls(properties.minimumCalls())
                .failureRateThreshold(properties.failureRatePercent())
                .waitDurationInOpenState(properties.openFor())
                .permittedNumberOfCallsInHalfOpenState(2)
                .automaticTransitionFromOpenToHalfOpenEnabled(false)
                .recordException(GuardedPronunciationScoringService::isServiceFailure)
                .build());
        breaker.getEventPublisher().onStateTransition(
                event -> log.warn("Circuit breaker chấm phát âm: {}", event.getStateTransition()));
    }

    @Override
    public PronunciationAssessment assess(byte[] wav, String referenceText) {
        try {
            return breaker.executeSupplier(() -> delegate.assess(wav, referenceText));
        } catch (CallNotPermittedException e) {
            log.warn("Circuit breaker đang mở, bỏ qua lời gọi Azure");
            throw new BusinessException(ErrorCode.SHADOWING_SCORING_UNAVAILABLE);
        }
    }

    CircuitBreaker.State state() {
        return breaker.getState();
    }

    /** Chỉ lỗi phía dịch vụ mới làm mở mạch; các lỗi nghiệp vụ khác (vd không có lời nói) thì Azure vẫn trả lời bình thường. */
    private static boolean isServiceFailure(Throwable error) {
        return !(error instanceof BusinessException business)
                || business.getErrorCode() == ErrorCode.SHADOWING_SCORING_UNAVAILABLE;
    }
}
