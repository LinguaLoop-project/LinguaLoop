package com.lingualoop.backend.auth.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Map;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.auth.entity.LoginAttempt;
import com.lingualoop.backend.auth.repository.LoginAttemptRepository;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.AuthProperties;

import lombok.RequiredArgsConstructor;

/** Đếm đăng nhập sai và tạm khoá theo email (BR-AUTH-03), kể cả email không có tài khoản (BR-AUTH-04). */
@Service
@RequiredArgsConstructor
public class LoginAttemptService {

    private final LoginAttemptRepository repository;
    private final AuthProperties authProperties;
    private final Clock clock;

    /** Ném {@code AUTH_ACCOUNT_LOCKED} kèm {@code lockedUntil} nếu email đang bị tạm khoá. */
    @Transactional(readOnly = true)
    public void assertNotLocked(String email) {
        Instant now = Instant.now(clock);
        repository.findByEmailIgnoreCase(email)
                .map(LoginAttempt::getLockedUntil)
                .filter(lockedUntil -> lockedUntil != null && lockedUntil.isAfter(now))
                .ifPresent(lockedUntil -> {
                    throw lockedException(lockedUntil);
                });
    }

    /** Ghi một lần sai; lần thứ {@code max-failed-attempts} thì khoá và đếm về 0. */
    @Transactional
    public FailureResult recordFailure(String email) {
        Instant now = Instant.now(clock);
        int max = authProperties.maxFailedAttempts();
        LoginAttempt attempt = repository.recordFailure(email, max, now.plus(authProperties.lockDuration()), now);
        Instant lockedUntil = attempt.getLockedUntil();
        if (lockedUntil != null && lockedUntil.isAfter(now)) {
            return new FailureResult(0, lockedUntil);
        }
        return new FailureResult(max - attempt.getFailedCount(), null);
    }

    /** Đăng nhập thành công: xoá bộ đếm. */
    @Transactional
    public void clear(String email) {
        repository.clear(email);
    }

    public static BusinessException lockedException(Instant lockedUntil) {
        return new BusinessException(ErrorCode.AUTH_ACCOUNT_LOCKED, Map.of("lockedUntil", lockedUntil));
    }

    /** {@code lockedUntil != null} nghĩa là lần sai này vừa gây khoá. */
    public record FailureResult(int remainingAttempts, Instant lockedUntil) {

        public boolean locked() {
            return lockedUntil != null;
        }
    }
}
