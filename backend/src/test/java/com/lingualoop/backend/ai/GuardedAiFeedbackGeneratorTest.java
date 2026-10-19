package com.lingualoop.backend.ai;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;

/** Circuit breaker quanh Gemini: mở khi dịch vụ lỗi liên tiếp, các yêu cầu sau báo lỗi ngay mà không gọi Gemini. */
class GuardedAiFeedbackGeneratorTest {

    private static final FeedbackRequest REQUEST = new FeedbackRequest("Hi", 90, null, null, null, null, List.of());
    private static final GeneratedFeedback OK = new GeneratedFeedback("tốt", "m", "v1", 1, 1);

    private static GuardedAiFeedbackGenerator guard(AiFeedbackGenerator delegate) {
        return new GuardedAiFeedbackGenerator(delegate, 4, 4, 50, Duration.ofMinutes(5));
    }

    @Test
    void failures_openTheCircuitAndLaterCallsFailFastWithoutCallingGemini() {
        AtomicInteger calls = new AtomicInteger();
        var guard = guard(request -> {
            calls.incrementAndGet();
            throw new BusinessException(ErrorCode.AI_FEEDBACK_UNAVAILABLE);
        });

        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> guard.generate(REQUEST)).isInstanceOf(BusinessException.class);
        }

        assertThat(guard.state()).isEqualTo(CircuitBreaker.State.OPEN);
        assertThatThrownBy(() -> guard.generate(REQUEST))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AI_FEEDBACK_UNAVAILABLE));
        assertThat(calls.get()).as("lượt thứ 5 không gọi tới Gemini").isEqualTo(4);
    }

    @Test
    void successfulCalls_keepTheCircuitClosed() {
        var guard = guard(request -> OK);

        for (int i = 0; i < 10; i++) {
            assertThat(guard.generate(REQUEST)).isSameAs(OK);
        }

        assertThat(guard.state()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    @Test
    void otherBusinessErrors_areNotServiceFailures() {
        var guard = guard(request -> {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        });

        for (int i = 0; i < 10; i++) {
            assertThatThrownBy(() -> guard.generate(REQUEST)).isInstanceOf(BusinessException.class);
        }

        assertThat(guard.state()).isEqualTo(CircuitBreaker.State.CLOSED);
    }
}
