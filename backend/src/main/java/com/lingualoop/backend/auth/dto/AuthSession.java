package com.lingualoop.backend.auth.dto;

/** Phiên vừa cấp: phần trả trong body và refresh token thô để controller đặt vào cookie. */
public record AuthSession(AuthResponse response, String refreshToken) {
}
