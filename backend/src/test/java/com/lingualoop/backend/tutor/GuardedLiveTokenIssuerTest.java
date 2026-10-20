package com.lingualoop.backend.tutor;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.util.concurrent.atomic.AtomicInteger;

import org.junit.jupiter.api.Test;

import io.github.resilience4j.circuitbreaker.CircuitBreaker;

/** Mạch cấp token Gemini Live mở khi lỗi liên tục và từ chối ngay, không gọi tiếp (BR-TUTOR-10). */
class GuardedLiveTokenIssuerTest {

    @Test
    void opensAfterRepeatedFailuresAndStopsCallingGemini() {
        AtomicInteger calls = new AtomicInteger();
        LiveTokenIssuer failing = prompt -> {
            calls.incrementAndGet();
            throw new IllegalStateException("Gemini quá tải");
        };
        GuardedLiveTokenIssuer guarded = new GuardedLiveTokenIssuer(failing, 4, 2, 50, Duration.ofSeconds(30));

        for (int i = 0; i < 2; i++) {
            assertThatThrownBy(() -> guarded.issue("p")).hasMessage("Gemini quá tải");
        }
        assertThat(guarded.state()).isEqualTo(CircuitBreaker.State.OPEN);

        assertThatThrownBy(() -> guarded.issue("p")).hasMessageContaining("đang mở");
        assertThat(calls).hasValue(2);
    }

    @Test
    void passesTheTokenThroughWhileHealthy() {
        LiveTokenIssuer.LiveToken token = new LiveTokenIssuer.LiveToken("t", "m", Instant.EPOCH);
        GuardedLiveTokenIssuer guarded = new GuardedLiveTokenIssuer(prompt -> token, 4, 2, 50, Duration.ofSeconds(30));

        assertThat(guarded.issue("p")).isSameAs(token);
        assertThat(guarded.state()).isEqualTo(CircuitBreaker.State.CLOSED);
    }
}
