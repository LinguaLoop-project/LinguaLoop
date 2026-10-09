package com.lingualoop.backend.auth.dto;

/** Link đặt lại còn dùng được; link hỏng không trả response này mà trả lỗi {@code AUTH_LINK_INVALID}. */
public record ValidateResetTokenResponse(boolean valid) {
}
