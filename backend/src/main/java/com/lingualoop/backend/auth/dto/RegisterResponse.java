package com.lingualoop.backend.auth.dto;

/** {@code mailSent=false} khi không gửi được thư xác thực: tài khoản vẫn được tạo, UI mời gửi lại. */
public record RegisterResponse(String email, boolean mailSent) {
}
