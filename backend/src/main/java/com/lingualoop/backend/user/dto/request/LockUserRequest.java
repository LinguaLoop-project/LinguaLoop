package com.lingualoop.backend.user.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Lý do khóa tài khoản, 1 đến 500 ký tự (BR-QT-03). */
public record LockUserRequest(
        @NotBlank(message = "Lý do khóa là bắt buộc")
        @Size(max = 500, message = "Lý do khóa tối đa 500 ký tự")
        String reason) {
}
