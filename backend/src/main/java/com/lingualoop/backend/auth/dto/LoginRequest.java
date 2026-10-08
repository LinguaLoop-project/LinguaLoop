package com.lingualoop.backend.auth.dto;

import jakarta.validation.constraints.NotBlank;

/** Không kiểm tra độ dài mật khẩu ở đây: mật khẩu sai kiểu gì cũng chỉ là "sai email hoặc mật khẩu" (BR-AUTH-04). */
public record LoginRequest(@NotBlank String email, @NotBlank String password) {

    public LoginRequest {
        email = email == null ? null : email.trim();
    }
}
