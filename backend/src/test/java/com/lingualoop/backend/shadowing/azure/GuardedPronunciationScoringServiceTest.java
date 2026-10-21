package com.lingualoop.backend.shadowing.azure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.ScoringGuardProperties;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;

/** Circuit breaker quanh lời gọi Azure: mở khi dịch vụ lỗi liên tiếp, bỏ qua lỗi do người học. */
class GuardedPronunciationScoringServiceTest {

    private static final byte[] WAV = new byte[0];
    private static final PronunciationAssessment OK =
            new PronunciationAssessment("hello", 90, 90, 90, 90, null, List.of());

    /** Cửa sổ 4 lượt, cần tối thiểu 4 lượt, mở khi lỗi từ 50%; giữ mở lâu để test không phụ thuộc đồng hồ. */
    private static ScoringGuardProperties properties() {
        return new ScoringGuardProperties(4, 4, 50, Duration.ofMinutes(5));
    }

    @Test
    void serviceFailures_openTheCircuitAndLaterCallsFailFastWithoutCallingAzure() {
        AtomicInteger calls = new AtomicInteger();
        var guard = new GuardedPronunciationScoringService((wav, text) -> {
            calls.incrementAndGet();
            throw new BusinessException(ErrorCode.SHADOWING_SCORING_UNAVAILABLE);
        }, properties());

        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> guard.assess(WAV, "hello")).isInstanceOf(BusinessException.class);
        }

        assertThat(guard.state()).isEqualTo(CircuitBreaker.State.OPEN);
        assertThatThrownBy(() -> guard.assess(WAV, "hello"))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.SHADOWING_SCORING_UNAVAILABLE));
        assertThat(calls.get()).as("lượt thứ 5 không gọi tới Azure").isEqualTo(4);
    }

    @Test
    void noSpeech_isNotAServiceFailure() {
        var guard = new GuardedPronunciationScoringService((wav, text) -> {
            throw new BusinessException(ErrorCode.SHADOWING_NO_SPEECH);
        }, properties());

        for (int i = 0; i < 10; i++) {
            assertThatThrownBy(() -> guard.assess(WAV, "hello"))
                    .isInstanceOfSatisfying(BusinessException.class,
                            e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.SHADOWING_NO_SPEECH));
        }

        assertThat(guard.state()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    @Test
    void unexpectedErrors_countAsFailures() {
        var guard = new GuardedPronunciationScoringService((wav, text) -> {
            throw new IllegalStateException("Azure sập");
        }, properties());

        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> guard.assess(WAV, "hello")).isInstanceOf(IllegalStateException.class);
        }

        assertThat(guard.state()).isEqualTo(CircuitBreaker.State.OPEN);
    }

    @Test
    void successfulCalls_keepTheCircuitClosed() {
        var guard = new GuardedPronunciationScoringService((wav, text) -> OK, properties());

        for (int i = 0; i < 10; i++) {
            assertThat(guard.assess(WAV, "hello")).isSameAs(OK);
        }

        assertThat(guard.state()).isEqualTo(CircuitBreaker.State.CLOSED);
    }
}
