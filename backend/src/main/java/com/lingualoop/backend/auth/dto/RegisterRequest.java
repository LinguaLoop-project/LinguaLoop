package com.lingualoop.backend.auth.dto;

import com.lingualoop.backend.common.validation.MaxBytes;

import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
        @NotBlank @Email String email,
        // BCrypt chỉ dùng 72 byte đầu nên giới hạn theo byte, không chỉ theo ký tự
        @NotNull @Size(min = 8, max = 72) @MaxBytes(72) String password,
        @NotBlank @Size(max = 50) String displayName,
        @AssertTrue boolean acceptTerms) {

    public RegisterRequest {
        email = email == null ? null : email.trim();
        displayName = displayName == null ? null : displayName.trim();
    }
}
