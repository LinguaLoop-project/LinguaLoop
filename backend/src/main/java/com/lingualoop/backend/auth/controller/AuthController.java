package com.lingualoop.backend.auth.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.auth.dto.AuthResponse;
import com.lingualoop.backend.auth.dto.AuthSession;
import com.lingualoop.backend.auth.dto.ForgotPasswordRequest;
import com.lingualoop.backend.auth.dto.GoogleLoginRequest;
import com.lingualoop.backend.auth.dto.LoginRequest;
import com.lingualoop.backend.auth.dto.RegisterRequest;
import com.lingualoop.backend.auth.dto.RegisterResponse;
import com.lingualoop.backend.auth.dto.ResendVerificationRequest;
import com.lingualoop.backend.auth.dto.ResetPasswordRequest;
import com.lingualoop.backend.auth.dto.ValidateResetTokenRequest;
import com.lingualoop.backend.auth.dto.ValidateResetTokenResponse;
import com.lingualoop.backend.auth.dto.VerifyEmailRequest;
import com.lingualoop.backend.auth.dto.VerifyEmailResponse;
import com.lingualoop.backend.auth.service.AuthService;
import com.lingualoop.backend.auth.service.EmailVerificationService;
import com.lingualoop.backend.auth.service.GoogleAuthService;
import com.lingualoop.backend.auth.service.PasswordResetService;
import com.lingualoop.backend.auth.service.RefreshInvalidException;
import com.lingualoop.backend.auth.web.RefreshCookies;
import com.lingualoop.backend.common.exception.ErrorResponse;
import com.lingualoop.backend.common.response.ApiResponse;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final GoogleAuthService googleAuthService;
    private final EmailVerificationService emailVerificationService;
    private final PasswordResetService passwordResetService;
    private final RefreshCookies refreshCookies;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<AuthResponse>> login(@Valid @RequestBody LoginRequest request,
            @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent) {
        return withSession(authService.login(request, userAgent));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<AuthResponse>> google(@Valid @RequestBody GoogleLoginRequest request,
            @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent) {
        return withSession(googleAuthService.login(request.code(), userAgent));
    }

    @PostMapping("/refresh")
    public ResponseEntity<ApiResponse<AuthResponse>> refresh(
            @CookieValue(name = RefreshCookies.NAME, required = false) String refreshToken,
            @RequestHeader(value = HttpHeaders.USER_AGENT, required = false) String userAgent) {
        return withSession(authService.refresh(refreshToken, userAgent));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = RefreshCookies.NAME, required = false) String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.noContent()
                .header(HttpHeaders.SET_COOKIE, refreshCookies.clear().toString())
                .build();
    }

    @PostMapping("/verify-email")
    public ApiResponse<VerifyEmailResponse> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        return ApiResponse.ok(new VerifyEmailResponse(emailVerificationService.verify(request.token())));
    }

    /** Luôn 202 (BR-AUTH-04): không cho biết email có tài khoản hay đã gửi hay chưa. */
    @PostMapping("/verify-email/resend")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        emailVerificationService.resend(request.email());
    }

    /** Luôn 202 (BR-AUTH-04): không cho biết email có tài khoản hay đã gửi thư hay chưa. */
    @PostMapping("/forgot-password")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public void forgotPassword(@Valid @RequestBody ForgotPasswordRequest request) {
        passwordResetService.request(request.email());
    }

    /** Để trang đặt lại báo link hỏng ngay khi mở link (AC-39); không dùng hết token. */
    @PostMapping("/reset-password/validate")
    public ApiResponse<ValidateResetTokenResponse> validateResetToken(
            @Valid @RequestBody ValidateResetTokenRequest request) {
        passwordResetService.validate(request.token());
        return ApiResponse.ok(new ValidateResetTokenResponse(true));
    }

    /** Không cấp phiên: người dùng đăng nhập lại bằng mật khẩu mới. */
    @PostMapping("/reset-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        passwordResetService.reset(request.token(), request.newPassword());
    }

    /** Refresh token hỏng: báo 401 và xoá cookie để trình duyệt không gửi lại token chết (AC-27). */
    @ExceptionHandler(RefreshInvalidException.class)
    public ResponseEntity<ErrorResponse> handleRefreshInvalid(RefreshInvalidException ex,
            HttpServletRequest request) {
        return ResponseEntity.status(ex.getErrorCode().getStatus())
                .header(HttpHeaders.SET_COOKIE, refreshCookies.clear().toString())
                .body(ErrorResponse.of(ex.getErrorCode(), ex.getMessage(), request.getRequestURI()));
    }

    private ResponseEntity<ApiResponse<AuthResponse>> withSession(AuthSession session) {
        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, refreshCookies.issue(session.refreshToken()).toString())
                .body(ApiResponse.ok(session.response()));
    }
}
