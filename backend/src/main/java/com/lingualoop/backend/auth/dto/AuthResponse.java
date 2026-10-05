package com.lingualoop.backend.auth.dto;

import java.time.Instant;

import com.lingualoop.backend.user.dto.MeResponse;

/** Access token (giữ trong bộ nhớ ở frontend) cùng hồ sơ người dùng. Refresh token nằm trong cookie, không trong body. */
public record AuthResponse(String accessToken, Instant expiresAt, MeResponse user) {
}
