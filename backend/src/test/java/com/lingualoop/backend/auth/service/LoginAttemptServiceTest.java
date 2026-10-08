package com.lingualoop.backend.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.auth.service.LoginAttemptService.FailureResult;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;

@SpringBootTest
@Import({ TestcontainersConfiguration.class, TestClockConfiguration.class })
class LoginAttemptServiceTest {

    @Autowired
    private LoginAttemptService service;

    @Autowired
    private MutableClock clock;

    @BeforeEach
    void resetClock() {
        clock.reset();
    }

    private static String uniqueEmail() {
        return "attempt-" + UUID.randomUUID() + "@x.com";
    }

    @Test
    void recordFailure_firstFourFailures_countDownRemainingAttempts_AC12() {
        String email = uniqueEmail();

        assertThat(service.recordFailure(email)).isEqualTo(new FailureResult(4, null));
        assertThat(service.recordFailure(email).remainingAttempts()).isEqualTo(3);
        assertThat(service.recordFailure(email).remainingAttempts()).isEqualTo(2);
        assertThat(service.recordFailure(email).remainingAttempts()).isEqualTo(1);
        assertThatCode(() -> service.assertNotLocked(email)).doesNotThrowAnyException();
    }

    @Test
    void recordFailure_fifthFailure_locksFor15Minutes_AC14() {
        String email = uniqueEmail();
        for (int i = 0; i < 4; i++) {
            service.recordFailure(email);
        }

        FailureResult fifth = service.recordFailure(email);

        assertThat(fifth.locked()).isTrue();
        assertThat(fifth.lockedUntil()).isBetween(Instant.now().plus(Duration.ofMinutes(14)),
                Instant.now().plus(Duration.ofMinutes(16)));
    }

    @Test
    void assertNotLocked_whileLocked_throwsWithLockedUntil_AC15() {
        String email = uniqueEmail();
        for (int i = 0; i < 5; i++) {
            service.recordFailure(email);
        }

        assertThatThrownBy(() -> service.assertNotLocked(email))
                .isInstanceOfSatisfying(BusinessException.class, e -> {
                    assertThat(e.getErrorCode()).isEqualTo(ErrorCode.AUTH_ACCOUNT_LOCKED);
                    assertThat(e.getDetails()).containsKey("lockedUntil");
                });
    }

    @Test
    void assertNotLocked_after15Minutes_unlocksAndCountStartsOver_AC14() {
        String email = uniqueEmail();
        for (int i = 0; i < 5; i++) {
            service.recordFailure(email);
        }

        clock.advance(Duration.ofMinutes(15).plusSeconds(1));

        assertThatCode(() -> service.assertNotLocked(email)).doesNotThrowAnyException();
        assertThat(service.recordFailure(email).remainingAttempts()).isEqualTo(4);
    }

    @Test
    void assertNotLocked_justBefore15Minutes_stillLocked() {
        String email = uniqueEmail();
        for (int i = 0; i < 5; i++) {
            service.recordFailure(email);
        }

        clock.advance(Duration.ofMinutes(14).plusSeconds(59));

        assertThatThrownBy(() -> service.assertNotLocked(email)).isInstanceOf(BusinessException.class);
    }

    @Test
    void clear_resetsCounter_AC08() {
        String email = uniqueEmail();
        service.recordFailure(email);
        service.recordFailure(email);

        service.clear(email);

        assertThat(service.recordFailure(email).remainingAttempts()).isEqualTo(4);
    }

    @Test
    void recordFailure_emailCaseDoesNotMatter_AC13() {
        String email = uniqueEmail();
        service.recordFailure(email);

        assertThat(service.recordFailure(email.toUpperCase()).remainingAttempts()).isEqualTo(3);
    }

    @Test
    void recordFailure_concurrentFailuresAreAllCounted() throws Exception {
        String email = uniqueEmail();
        int threads = 4;
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        try {
            List<Future<FailureResult>> results = new ArrayList<>();
            for (int i = 0; i < threads; i++) {
                results.add(pool.submit(() -> {
                    start.await();
                    return service.recordFailure(email);
                }));
            }
            start.countDown();
            List<Integer> remaining = new ArrayList<>();
            for (Future<FailureResult> f : results) {
                remaining.add(f.get().remainingAttempts());
            }
            assertThat(remaining).containsExactlyInAnyOrder(4, 3, 2, 1);
        } finally {
            pool.shutdownNow();
        }
        assertThat(service.recordFailure(email).locked()).isTrue();
    }
}
