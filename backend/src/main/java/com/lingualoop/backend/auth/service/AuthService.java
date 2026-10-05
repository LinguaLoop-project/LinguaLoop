package com.lingualoop.backend.auth.service;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.auth.dto.RegisterRequest;
import com.lingualoop.backend.auth.dto.RegisterResponse;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserAccountService userAccountService;
    private final EmailVerificationService emailVerificationService;
    private final PasswordEncoder passwordEncoder;
    private final TransactionTemplate transactionTemplate;

    /** Đăng ký không cấp phiên. Thư được gửi sau commit; gửi lỗi chỉ làm {@code mailSent=false}. */
    public RegisterResponse register(RegisterRequest request) {
        String passwordHash = passwordEncoder.encode(request.password());
        PendingVerification pending;
        try {
            pending = transactionTemplate.execute(status -> {
                if (userAccountService.findByEmail(request.email()).isPresent()) {
                    throw new BusinessException(ErrorCode.AUTH_EMAIL_TAKEN);
                }
                UserAccount account = userAccountService.createLocal(request.email(), request.displayName(),
                        passwordHash);
                return new PendingVerification(account, emailVerificationService.issueToken(account.id()));
            });
        } catch (DataIntegrityViolationException e) {
            // hai request cùng email chạy đồng thời: unique index của DB là chốt cuối
            throw new BusinessException(ErrorCode.AUTH_EMAIL_TAKEN);
        }
        return new RegisterResponse(request.email(),
                emailVerificationService.trySendMail(pending.account(), pending.rawToken()));
    }

    private record PendingVerification(UserAccount account, String rawToken) {
    }
}
