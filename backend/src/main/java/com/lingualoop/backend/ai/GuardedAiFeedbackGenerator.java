package com.lingualoop.backend.ai;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.resilience.ExternalCallGuard;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;

/**
 * Bọc Gemini bằng circuit breaker: trong cửa sổ 10 lượt, đủ 5 lượt mà lỗi từ 50% thì mở mạch 30 giây, các yêu cầu
 * nhận xét trong lúc đó báo {@code AI_FEEDBACK_UNAVAILABLE} ngay (và được hoàn lượt) thay vì chờ Gemini hết thời gian.
 */
@Primary
@Service
class GuardedAiFeedbackGenerator implements AiFeedbackGenerator {

    private final AiFeedbackGenerator delegate;
    private final ExternalCallGuard guard;

    @Autowired
    GuardedAiFeedbackGenerator(@Qualifier("geminiFeedbackGenerator") AiFeedbackGenerator delegate) {
        this(delegate, 10, 5, 50, Duration.ofSeconds(30));
    }

    GuardedAiFeedbackGenerator(AiFeedbackGenerator delegate, int windowSize, int minimumCalls, int failureRatePercent,
            Duration openFor) {
        this.delegate = delegate;
        this.guard = new ExternalCallGuard("gemini-feedback", windowSize, minimumCalls, failureRatePercent, openFor,
                error -> !(error instanceof BusinessException business)
                        || business.getErrorCode() == ErrorCode.AI_FEEDBACK_UNAVAILABLE);
    }

    @Override
    public GeneratedFeedback generate(FeedbackRequest request) {
        return guard.call(() -> delegate.generate(request),
                () -> new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE));
    }

    CircuitBreaker.State state() {
        return guard.state();
    }
}
