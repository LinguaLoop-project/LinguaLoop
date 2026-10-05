package com.lingualoop.backend.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.auth.dto.RegisterRequest;
import com.lingualoop.backend.auth.dto.RegisterResponse;
import com.lingualoop.backend.auth.dto.ResendVerificationRequest;
import com.lingualoop.backend.auth.dto.VerifyEmailRequest;
import com.lingualoop.backend.auth.dto.VerifyEmailResponse;
import com.lingualoop.backend.auth.service.AuthService;
import com.lingualoop.backend.auth.service.EmailVerificationService;
import com.lingualoop.backend.common.response.ApiResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;
    private final EmailVerificationService emailVerificationService;

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ApiResponse.ok(authService.register(request));
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
}
