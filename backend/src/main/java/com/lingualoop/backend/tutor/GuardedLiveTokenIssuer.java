package com.lingualoop.backend.tutor;

import java.time.Duration;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.context.annotation.Primary;
import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.resilience.ExternalCallGuard;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;

/**
 * Bọc việc cấp token bằng circuit breaker (BR-TUTOR-10): trong cửa sổ 10 lượt, đủ 5 lượt mà lỗi từ 50% thì mở mạch
 * 30 giây, các yêu cầu trong lúc đó bị từ chối ngay thay vì chờ Gemini hết thời gian.
 */
@Primary
@Service
class GuardedLiveTokenIssuer implements LiveTokenIssuer {

    private final LiveTokenIssuer delegate;
    private final ExternalCallGuard guard;

    @Autowired
    GuardedLiveTokenIssuer(@Qualifier("geminiLiveTokenIssuer") LiveTokenIssuer delegate) {
        this(delegate, 10, 5, 50, Duration.ofSeconds(30));
    }

    GuardedLiveTokenIssuer(LiveTokenIssuer delegate, int windowSize, int minimumCalls, int failureRatePercent,
            Duration openFor) {
        this.delegate = delegate;
        this.guard = new ExternalCallGuard("gemini-live", windowSize, minimumCalls, failureRatePercent, openFor,
                error -> true);
    }

    @Override
    public LiveToken issue(String systemPrompt) {
        return guard.call(() -> delegate.issue(systemPrompt),
                () -> new IllegalStateException("Mạch cấp token Gemini Live đang mở"));
    }

    CircuitBreaker.State state() {
        return guard.state();
    }
}
