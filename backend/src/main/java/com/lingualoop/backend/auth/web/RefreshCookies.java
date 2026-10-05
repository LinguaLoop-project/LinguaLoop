package com.lingualoop.backend.auth.web;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import com.lingualoop.backend.config.AuthProperties;

import lombok.RequiredArgsConstructor;

/** Dựng và xoá cookie refresh token: HttpOnly, chỉ gửi tới {@code /api/v1/auth}. */
@Component
@RequiredArgsConstructor
public class RefreshCookies {

    public static final String NAME = "ll_refresh";
    private static final String PATH = "/api/v1/auth";

    private final AuthProperties authProperties;

    public ResponseCookie issue(String rawToken) {
        return base(rawToken).maxAge(authProperties.refreshTokenTtl()).build();
    }

    public ResponseCookie clear() {
        return base("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder base(String value) {
        AuthProperties.Cookie cookie = authProperties.cookie();
        return ResponseCookie.from(NAME, value)
                .httpOnly(true)
                .secure(cookie.secure())
                .sameSite(cookie.sameSite())
                .path(PATH);
    }
}
