package com.lingualoop.backend.auth.dto;

import com.lingualoop.backend.common.validation.MaxBytes;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Ô nhập lại mật khẩu chỉ kiểm tra ở frontend. */
public record ResetPasswordRequest(
        @NotBlank String token,
        // BCrypt chỉ dùng 72 byte đầu nên giới hạn theo byte, giống RegisterRequest (BR-AUTH-02)
        @NotNull @Size(min = 8, max = 72) @MaxBytes(72) String newPassword) {
}
