package com.lingualoop.backend.auth.service;

import java.time.Clock;
import java.time.Instant;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.auth.dto.VerifyEmailResponse;
import com.lingualoop.backend.auth.entity.EmailToken;
import com.lingualoop.backend.auth.mail.AuthMailSender;
import com.lingualoop.backend.auth.repository.EmailTokenRepository;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.config.AuthProperties;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class EmailVerificationService {

    private final EmailTokenRepository emailTokenRepository;
    private final UserAccountService userAccountService;
    private final AuthMailSender authMailSender;
    private final AuthProperties authProperties;
    private final Clock clock;
    private final TransactionTemplate transactionTemplate;

    /** Tạo token xác thực email mới và trả về token thô (chỉ DB giữ hash). Gọi trong transaction của caller. */
    public String issueToken(UUID userId) {
        String raw = SecureTokens.generate();
        Instant now = Instant.now(clock);
        emailTokenRepository.save(EmailToken.issue(userId, EmailToken.VERIFY_EMAIL, SecureTokens.sha256(raw), now,
                now.plus(authProperties.verifyTtl())));
        return raw;
    }

    /** Gửi thư xác thực; lỗi gửi chỉ được ghi log và trả {@code false}, không làm hỏng luồng gọi. */
    public boolean trySendMail(UserAccount account, String rawToken) {
        try {
            authMailSender.sendVerifyEmail(account.email(), account.uiLanguage(), rawToken);
            return true;
        } catch (RuntimeException e) {
            log.warn("Could not send verification mail to user {}", account.id(), e);
            return false;
        }
    }

    /**
     * Xác thực email bằng token thô. Email đã xác thực từ trước thì trả {@code ALREADY_VERIFIED} (không lỗi);
     * token sai, đã dùng hoặc quá hạn thì {@code AUTH_LINK_INVALID}.
     */
    @Transactional
    public VerifyEmailResponse.Result verify(String rawToken) {
        EmailToken token = emailTokenRepository
                .findByTokenHashAndPurpose(SecureTokens.sha256(rawToken), EmailToken.VERIFY_EMAIL)
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_LINK_INVALID));
        UserAccount account = userAccountService.findById(token.getUserId())
                .orElseThrow(() -> new BusinessException(ErrorCode.AUTH_LINK_INVALID));
        if (account.emailVerified()) {
            return VerifyEmailResponse.Result.ALREADY_VERIFIED;
        }
        Instant now = Instant.now(clock);
        if (token.isUsed() || token.isExpiredAt(now)) {
            throw new BusinessException(ErrorCode.AUTH_LINK_INVALID);
        }
        token.markUsed(now);
        userAccountService.markEmailVerified(account.id());
        return VerifyEmailResponse.Result.VERIFIED;
    }

    /**
     * Gửi lại thư xác thực. Chỉ gửi khi email thuộc tài khoản chưa xác thực, có mật khẩu và thư gần nhất đã quá
     * thời gian chờ; các trường hợp còn lại lặng lẽ bỏ qua để phản hồi không lộ email có tồn tại hay không.
     */
    public void resend(String email) {
        Optional<PendingMail> pending = transactionTemplate.execute(status -> prepareResend(email));
        pending.ifPresent(mail -> trySendMail(mail.account(), mail.rawToken()));
    }

    private Optional<PendingMail> prepareResend(String email) {
        Optional<UserAccount> found = userAccountService.findByEmail(email);
        if (found.isEmpty() || found.get().emailVerified() || !found.get().hasPassword()) {
            return Optional.empty();
        }
        UserAccount account = found.get();
        Instant now = Instant.now(clock);
        boolean tooSoon = emailTokenRepository
                .findFirstByUserIdAndPurposeOrderByCreatedAtDesc(account.id(), EmailToken.VERIFY_EMAIL)
                .map(last -> last.getCreatedAt().plus(authProperties.resendCooldown()).isAfter(now))
                .orElse(false);
        if (tooSoon) {
            return Optional.empty();
        }
        emailTokenRepository.markAllUsed(account.id(), EmailToken.VERIFY_EMAIL, now);
        return Optional.of(new PendingMail(account, issueToken(account.id())));
    }

    private record PendingMail(UserAccount account, String rawToken) {
    }
}
