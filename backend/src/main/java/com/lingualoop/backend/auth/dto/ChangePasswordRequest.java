package com.lingualoop.backend.auth.dto;

import com.lingualoop.backend.common.validation.MaxBytes;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * {@code currentPassword} bắt buộc khi tài khoản đã có mật khẩu, bỏ qua với tài khoản Google chưa tạo mật khẩu
 * (kiểm tra trong service vì phụ thuộc dữ liệu). Ô nhập lại mật khẩu chỉ kiểm tra ở frontend.
 */
public record ChangePasswordRequest(
        String currentPassword,
        // BCrypt chỉ dùng 72 byte đầu nên giới hạn theo byte, giống RegisterRequest (BR-AUTH-02)
        @NotNull @Size(min = 8, max = 72) @MaxBytes(72) String newPassword) {
}
