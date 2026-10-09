package com.lingualoop.backend.auth.service;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.auth.service.LoginAttemptService.FailureResult;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

/**
 * Tạo hoặc đổi mật khẩu khi đã đăng nhập (UC-AUTH-07). Không {@code @Transactional} ở mức method để lần nhập sai
 * mật khẩu hiện tại được ghi nhận (commit) trước khi ném lỗi, giống {@code AuthService.login}; việc đổi hash và
 * thu hồi phiên khác chạy chung một transaction.
 */
@Service
@RequiredArgsConstructor
public class PasswordService {

    /** BCrypt chỉ dùng 72 byte đầu; mật khẩu hiện tại dài hơn thế chắc chắn không phải mật khẩu đã lưu. */
    private static final int MAX_PASSWORD_BYTES = 72;

    private final UserAccountService userAccountService;
    private final LoginAttemptService loginAttemptService;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;
    private final TransactionTemplate transactionTemplate;

    /**
     * @param sessionId phiên đang dùng (claim {@code sid}); phiên này được giữ, mọi phiên khác bị thu hồi.
     *                  {@code null} (token cũ không có sid) thì thu hồi tất cả.
     */
    public void changePassword(UUID userId, UUID sessionId, String currentPassword, String newPassword) {
        UserAccount account = userAccountService.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));

        if (account.hasPassword()) {
            verifyCurrentPassword(account, currentPassword);
        }

        String newHash = passwordEncoder.encode(newPassword);
        transactionTemplate.executeWithoutResult(status -> {
            userAccountService.updatePasswordHash(userId, newHash);
            refreshTokenService.revokeAllExcept(userId, sessionId);
        });
    }

    private void verifyCurrentPassword(UserAccount account, String currentPassword) {
        loginAttemptService.assertNotLocked(account.email());
        if (currentPassword == null || currentPassword.isBlank()) {
            throw new FieldValidationException("currentPassword", "NotBlank");
        }
        boolean tooLong = currentPassword.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES;
        if (tooLong || !passwordEncoder.matches(currentPassword, account.passwordHash())) {
            throw wrongPassword(loginAttemptService.recordFailure(account.email()));
        }
        loginAttemptService.clear(account.email());
    }

    private static BusinessException wrongPassword(FailureResult failure) {
        if (failure.locked()) {
            return LoginAttemptService.lockedException(failure.lockedUntil());
        }
        return new BusinessException(ErrorCode.AUTH_CURRENT_PASSWORD_WRONG,
                Map.of("remainingAttempts", failure.remainingAttempts()));
    }
}
