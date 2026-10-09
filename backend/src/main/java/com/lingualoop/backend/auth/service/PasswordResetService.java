package com.lingualoop.backend.auth.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.auth.entity.EmailToken;
import com.lingualoop.backend.auth.mail.AuthMailDispatcher;
import com.lingualoop.backend.auth.repository.EmailTokenRepository;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.AuthProperties;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

/** Quên và đặt lại mật khẩu qua liên kết trong thư (UC-AUTH-06). */
@Service
@RequiredArgsConstructor
public class PasswordResetService {

    private final EmailTokenRepository emailTokenRepository;
    private final UserAccountService userAccountService;
    private final RefreshTokenService refreshTokenService;
    private final LoginAttemptService loginAttemptService;
    private final AuthMailDispatcher authMailDispatcher;
    private final PasswordEncoder passwordEncoder;
    private final AuthProperties authProperties;
    private final Clock clock;
    private final TransactionTemplate transactionTemplate;

    /**
     * Cấp liên kết đặt lại và gửi thư. Chỉ gửi khi email có tài khoản, tài khoản không bị quản trị viên khoá và thư
     * đặt lại gần nhất đã quá thời gian chờ; các trường hợp còn lại lặng lẽ bỏ qua để phản hồi không lộ email có
     * tồn tại hay không (BR-AUTH-04). Thư gửi ở luồng nền sau khi transaction đã commit.
     */
    public void request(String email) {
        Optional<PendingMail> pending = transactionTemplate.execute(status -> prepareRequest(email));
        pending.ifPresent(mail -> authMailDispatcher.sendResetPassword(mail.account(), mail.rawToken()));
    }

    private Optional<PendingMail> prepareRequest(String email) {
        Optional<UserAccount> found = userAccountService.findByEmail(email);
        // Tài khoản bị khoá thì có gửi thư cũng vô ích: BR-AUTH-10 vẫn chặn đăng nhập
        if (found.isEmpty() || found.get().disabled()) {
            return Optional.empty();
        }
        UserAccount account = found.get();
        Instant now = Instant.now(clock);
        boolean tooSoon = emailTokenRepository
                .findFirstByUserIdAndPurposeOrderByCreatedAtDesc(account.id(), EmailToken.RESET_PASSWORD)
                .map(last -> last.getCreatedAt().plus(authProperties.resendCooldown()).isAfter(now))
                .orElse(false);
        if (tooSoon) {
            return Optional.empty();
        }
        emailTokenRepository.markAllUsed(account.id(), EmailToken.RESET_PASSWORD, now);
        String raw = SecureTokens.generate();
        emailTokenRepository.save(EmailToken.issue(account.id(), EmailToken.RESET_PASSWORD, SecureTokens.sha256(raw),
                now, now.plus(authProperties.resetTtl())));
        return Optional.of(new PendingMail(account, raw));
    }

    /** Chỉ kiểm tra, không đánh dấu đã dùng; liên kết hỏng thì {@code AUTH_LINK_INVALID} (AC-39). */
    @Transactional(readOnly = true)
    public void validate(String rawToken) {
        requireUsableToken(rawToken, Instant.now(clock));
    }

    /**
     * Đặt mật khẩu mới: dùng hết liên kết, đánh dấu email đã xác thực (BR-AUTH-05), thu hồi mọi phiên (BR-AUTH-09)
     * và xoá bộ đếm sai mật khẩu để tài khoản đang bị khoá đăng nhập được ngay. Không cấp phiên mới.
     */
    public void reset(String rawToken, String newPassword) {
        String newHash = passwordEncoder.encode(newPassword);
        transactionTemplate.executeWithoutResult(status -> applyReset(rawToken, newHash));
    }

    private void applyReset(String rawToken, String newHash) {
        Instant now = Instant.now(clock);
        EmailToken token = requireUsableToken(rawToken, now);
        UserAccount account = userAccountService.findById(token.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_LINK_INVALID));

        token.markUsed(now);
        emailTokenRepository.markAllUsed(account.id(), EmailToken.RESET_PASSWORD, now);
        userAccountService.updatePasswordHash(account.id(), newHash);
        userAccountService.markEmailVerified(account.id());
        refreshTokenService.revokeAllForUser(account.id());
        loginAttemptService.clear(account.email());
    }

    private EmailToken requireUsableToken(String rawToken, Instant now) {
        EmailToken token = emailTokenRepository
                .findByTokenHashAndPurpose(SecureTokens.sha256(rawToken), EmailToken.RESET_PASSWORD)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_LINK_INVALID));
        if (token.isUsed() || token.isExpiredAt(now)) {
            throw new BusinessException(ErrorCode.AUTH_LINK_INVALID);
        }
        return token;
    }

    private record PendingMail(UserAccount account, String rawToken) {
    }
}
