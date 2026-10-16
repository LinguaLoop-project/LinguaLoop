package com.lingualoop.backend.auth.service;

import com.lingualoop.backend.auth.dto.response.AuthResponse;

/** Phiên vừa cấp: phần trả trong body và refresh token thô để controller đặt vào cookie. */
public record AuthSession(AuthResponse response, String refreshToken) {
}
