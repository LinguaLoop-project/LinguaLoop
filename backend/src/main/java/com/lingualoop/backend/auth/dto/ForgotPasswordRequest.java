package com.lingualoop.backend.auth.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ForgotPasswordRequest(@NotBlank @Email String email) {

    public ForgotPasswordRequest {
        email = email == null ? null : email.trim();
    }
}
