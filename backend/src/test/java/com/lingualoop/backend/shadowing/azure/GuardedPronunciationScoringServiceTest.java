package com.lingualoop.backend.shadowing.azure;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;
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
        return new ScoringGuardProperties(4, 4, 50, Duration.ofMinutes(5), 4, Duration.ofMillis(100));
    }

    private static ScoringGuardProperties limited(int maxConcurrent, Duration queueWait) {
        return new ScoringGuardProperties(4, 4, 50, Duration.ofMinutes(5), maxConcurrent, queueWait);
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

    @Test
    void busy_isNotAServiceFailure_soAThrottledAzureNeverLocksOutEveryLearner() {
        var guard = new GuardedPronunciationScoringService((wav, text) -> {
            throw new BusinessException(ErrorCode.SHADOWING_SCORING_BUSY);
        }, properties());

        for (int i = 0; i < 10; i++) {
            assertThatThrownBy(() -> guard.assess(WAV, "hello"))
                    .isInstanceOfSatisfying(BusinessException.class,
                            e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.SHADOWING_SCORING_BUSY));
        }

        assertThat(guard.state()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    @Test
    void callsBeyondTheConcurrencyLimit_areTurnedAwayAsBusyWithoutCallingAzure() throws Exception {
        int limit = 3;
        int requests = 8;
        CountDownLatch inside = new CountDownLatch(limit);
        CountDownLatch release = new CountDownLatch(1);
        AtomicInteger calls = new AtomicInteger();
        var guard = new GuardedPronunciationScoringService((wav, text) -> {
            calls.incrementAndGet();
            inside.countDown();
            try {
                release.await(10, TimeUnit.SECONDS);
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            }
            return OK;
        }, limited(limit, Duration.ofMillis(50)));
        ExecutorService pool = Executors.newFixedThreadPool(requests);
        try {
            List<Future<Object>> results = new ArrayList<>();
            for (int i = 0; i < requests; i++) {
                results.add(pool.submit(() -> {
                    try {
                        return guard.assess(WAV, "hello");
                    } catch (BusinessException e) {
                        return e.getErrorCode();
                    }
                }));
                if (i == limit - 1) {
                    assertThat(inside.await(5, TimeUnit.SECONDS)).as("đủ %d lời gọi đang chạy", limit).isTrue();
                }
            }
            // các lời gọi thừa bị từ chối khi Azure còn đang bận, rồi mới thả các lời gọi đang chạy
            long busy = 0;
            for (int i = limit; i < requests; i++) {
                busy += results.get(i).get(5, TimeUnit.SECONDS) == ErrorCode.SHADOWING_SCORING_BUSY ? 1 : 0;
            }
            release.countDown();
            for (int i = 0; i < limit; i++) {
                assertThat(results.get(i).get(5, TimeUnit.SECONDS)).isSameAs(OK);
            }
            assertThat(busy).isEqualTo(requests - limit);
            assertThat(calls.get()).as("chỉ %d lời gọi tới Azure", limit).isEqualTo(limit);
        } finally {
            release.countDown();
            pool.shutdownNow();
        }
        assertThat(guard.state()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    @Test
    void permitsAreReturned_evenWhenAzureFails() {
        var guard = new GuardedPronunciationScoringService((wav, text) -> {
            throw new IllegalStateException("Azure sập");
        }, limited(1, Duration.ofMillis(20)));

        // nếu lượt trước làm rò permit thì lượt sau đã bị báo bận thay vì gặp lỗi gốc
        assertThatThrownBy(() -> guard.assess(WAV, "hello")).isInstanceOf(IllegalStateException.class);
        assertThatThrownBy(() -> guard.assess(WAV, "hello")).isInstanceOf(IllegalStateException.class);
    }

    @Test
    void afterTheCircuitWaitsOut_aHealthyAzureClosesItAgain() throws Exception {
        AtomicInteger calls = new AtomicInteger();
        var guard = new GuardedPronunciationScoringService((wav, text) -> {
            if (calls.incrementAndGet() <= 4) {
                throw new BusinessException(ErrorCode.SHADOWING_SCORING_UNAVAILABLE);
            }
            return OK;
        }, new ScoringGuardProperties(4, 4, 50, Duration.ofMillis(200), 4, Duration.ofMillis(100)));
        for (int i = 0; i < 4; i++) {
            assertThatThrownBy(() -> guard.assess(WAV, "hello")).isInstanceOf(BusinessException.class);
        }
        assertThat(guard.state()).isEqualTo(CircuitBreaker.State.OPEN);

        Thread.sleep(300);
        assertThat(guard.assess(WAV, "hello")).isSameAs(OK);
        assertThat(guard.assess(WAV, "hello")).isSameAs(OK);

        assertThat(guard.state()).isEqualTo(CircuitBreaker.State.CLOSED);
    }

    @Test
    void interruptedWhileWaitingForAPermit_failsAsUnavailableAndKeepsTheInterruptFlag() {
        var guard = new GuardedPronunciationScoringService((wav, text) -> OK, properties());

        Thread.currentThread().interrupt();
        try {
            assertThatThrownBy(() -> guard.assess(WAV, "hello"))
                    .isInstanceOfSatisfying(BusinessException.class,
                            e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.SHADOWING_SCORING_UNAVAILABLE));
            assertThat(Thread.currentThread().isInterrupted()).as("cờ ngắt được giữ lại").isTrue();
        } finally {
            Thread.interrupted(); // xoá cờ để không ảnh hưởng test khác
        }
        assertThat(guard.state()).isEqualTo(CircuitBreaker.State.CLOSED);
    }
}
