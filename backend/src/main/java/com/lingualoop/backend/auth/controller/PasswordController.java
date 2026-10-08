package com.lingualoop.backend.auth.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.auth.dto.ChangePasswordRequest;
import com.lingualoop.backend.auth.service.PasswordService;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.security.SecurityUtils;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Đường dẫn nằm dưới {@code /users/**} nên cần Bearer token mà {@code SecurityConfig} không phải sửa. */
@RestController
@RequestMapping("/api/v1/users/me/password")
@RequiredArgsConstructor
public class PasswordController {

    private final PasswordService passwordService;

    @PutMapping
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void changePassword(@CurrentUserId UUID userId, @Valid @RequestBody ChangePasswordRequest request) {
        passwordService.changePassword(userId, SecurityUtils.currentSessionId().orElse(null),
                request.currentPassword(), request.newPassword());
    }
}
