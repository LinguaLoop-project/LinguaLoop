package com.lingualoop.backend.auth.dto.response;

/** Link đặt lại còn dùng được; link hỏng không trả response này mà trả lỗi {@code AUTH_LINK_INVALID}. */
public record ValidateResetTokenResponse(boolean valid) {
}
