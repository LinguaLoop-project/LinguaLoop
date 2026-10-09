package com.lingualoop.backend.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Bind từ {@code app.auth.*}. */
@Validated
@ConfigurationProperties("app.auth")
public record AuthProperties(
        @NotBlank String frontendUrl,
        @NotBlank @DefaultValue("no-reply@lingualoop.local") String mailFrom,
        @Positive @DefaultValue("5") int maxFailedAttempts,
        @NotNull @DefaultValue("15m") Duration lockDuration,
        @NotNull @DefaultValue("24h") Duration verifyTtl,
        @NotNull @DefaultValue("30m") Duration resetTtl,
        @NotNull @DefaultValue("60s") Duration resendCooldown,
        @NotNull @DefaultValue("30d") Duration refreshTokenTtl,
        /** Token vừa bị thu hồi trong khoảng này vẫn được đổi tiếp (nhiều tab refresh cùng lúc). */
        @NotNull @DefaultValue("10s") Duration refreshReuseGrace,
        @NotNull @DefaultValue Cookie cookie) {

    public record Cookie(
            @NotBlank @DefaultValue("Lax") String sameSite,
            @DefaultValue("false") boolean secure) {
    }
}
