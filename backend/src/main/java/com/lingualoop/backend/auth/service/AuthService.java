package com.lingualoop.backend.auth.service;

import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionTemplate;

import com.lingualoop.backend.auth.dto.AuthResponse;
import com.lingualoop.backend.auth.dto.AuthSession;
import com.lingualoop.backend.auth.dto.LoginRequest;
import com.lingualoop.backend.auth.dto.RegisterRequest;
import com.lingualoop.backend.auth.dto.RegisterResponse;
import com.lingualoop.backend.auth.service.LoginAttemptService.FailureResult;
import com.lingualoop.backend.auth.service.RefreshTokenService.Rotation;
import com.lingualoop.backend.auth.service.RefreshTokenService.Session;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.user.dto.UserAccount;
import com.lingualoop.backend.user.service.UserAccountService;

@Service
public class AuthService {

    /** BCrypt chỉ dùng 72 byte đầu; dài hơn thì chắc chắn không phải mật khẩu đã đăng ký (xem RegisterRequest). */
    private static final int MAX_PASSWORD_BYTES = 72;

    private final UserAccountService userAccountService;
    private final EmailVerificationService emailVerificationService;
    private final LoginAttemptService loginAttemptService;
    private final RefreshTokenService refreshTokenService;
    private final JwtTokenService jwtTokenService;
    private final PasswordEncoder passwordEncoder;
    private final TransactionTemplate transactionTemplate;

    /** Hash giả để email không tồn tại vẫn tốn thời gian {@code matches} như email có tài khoản. */
    private final String dummyPasswordHash;

    public AuthService(UserAccountService userAccountService, EmailVerificationService emailVerificationService,
            LoginAttemptService loginAttemptService, RefreshTokenService refreshTokenService,
            JwtTokenService jwtTokenService, PasswordEncoder passwordEncoder, TransactionTemplate transactionTemplate) {
        this.userAccountService = userAccountService;
        this.emailVerificationService = emailVerificationService;
        this.loginAttemptService = loginAttemptService;
        this.refreshTokenService = refreshTokenService;
        this.jwtTokenService = jwtTokenService;
        this.passwordEncoder = passwordEncoder;
        this.transactionTemplate = transactionTemplate;
        this.dummyPasswordHash = passwordEncoder.encode(UUID.randomUUID().toString());
    }

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

    /**
     * Đăng nhập bằng email và mật khẩu. Không đánh dấu {@code @Transactional} để lần sai được ghi nhận
     * (commit) trước khi ném lỗi. Thứ tự kiểm tra bám UC-AUTH-02 và BR-AUTH-04: chỉ lộ "bị khoá bởi admin" hay
     * "chưa xác thực email" sau khi đã nhập đúng mật khẩu.
     */
    public AuthSession login(LoginRequest request, String userAgent) {
        String email = request.email();
        loginAttemptService.assertNotLocked(email);

        UserAccount account = userAccountService.findByEmail(email).orElse(null);
        if (!passwordMatches(request.password(), account)) {
            throw invalidCredentials(loginAttemptService.recordFailure(email));
        }
        loginAttemptService.clear(email);

        if (account.disabled()) {
            throw new BusinessException(ErrorCode.AUTH_ACCOUNT_DISABLED);
        }
        if (!account.emailVerified()) {
            throw new BusinessException(ErrorCode.AUTH_EMAIL_NOT_VERIFIED);
        }
        return openSession(account, userAgent);
    }

    /** Mở phiên mới cho tài khoản đã được xác thực (mật khẩu hoặc Google): access token có {@code sid} + refresh token. */
    public AuthSession openSession(UserAccount account, String userAgent) {
        Session session = refreshTokenService.startSession(account.id(), userAgent);
        return new AuthSession(accessResponse(account, session.familyId()), session.rawToken());
    }

    /**
     * Đổi refresh token (từ cookie) lấy access token mới và refresh token mới. Tài khoản bị khoá hoặc đã bị
     * xoá thì thu hồi cả chuỗi để các token còn lại cũng hết dùng được.
     */
    public AuthSession refresh(String rawRefreshToken, String userAgent) {
        Rotation rotation = refreshTokenService.rotate(rawRefreshToken, userAgent);
        UserAccount account = userAccountService.findById(rotation.userId()).orElse(null);
        if (account == null) {
            refreshTokenService.revokeFamily(rotation.familyId());
            throw new RefreshInvalidException();
        }
        if (account.disabled()) {
            refreshTokenService.revokeFamily(rotation.familyId());
            throw new BusinessException(ErrorCode.AUTH_ACCOUNT_DISABLED);
        }
        return new AuthSession(accessResponse(account, rotation.familyId()), rotation.rawToken());
    }

    /** Đăng xuất thiết bị hiện tại; không có hoặc sai cookie thì coi như đã đăng xuất. */
    public void logout(String rawRefreshToken) {
        refreshTokenService.revokeSession(rawRefreshToken);
    }

    private AuthResponse accessResponse(UserAccount account, UUID sessionId) {
        JwtTokenService.AccessToken access = jwtTokenService.issueAccessToken(account.id(), account.role(), sessionId);
        return new AuthResponse(access.token(), access.expiresAt(), account.toMe());
    }

    /** Luôn chạy một lần {@code matches} (với hash giả nếu cần) để thời gian phản hồi không lộ email có tồn tại. */
    private boolean passwordMatches(String rawPassword, UserAccount account) {
        String hash = account != null && account.hasPassword() ? account.passwordHash() : dummyPasswordHash;
        boolean tooLong = rawPassword.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES;
        boolean matches = passwordEncoder.matches(tooLong ? "" : rawPassword, hash);
        return matches && !tooLong && account != null && account.hasPassword();
    }

    private BusinessException invalidCredentials(FailureResult failure) {
        if (failure.locked()) {
            return LoginAttemptService.lockedException(failure.lockedUntil());
        }
        return new BusinessException(ErrorCode.AUTH_INVALID_CREDENTIALS,
                Map.of("remainingAttempts", failure.remainingAttempts()));
    }

    private record PendingVerification(UserAccount account, String rawToken) {
    }
}
