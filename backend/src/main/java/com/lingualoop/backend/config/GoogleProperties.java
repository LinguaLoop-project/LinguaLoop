package com.lingualoop.backend.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/** Bind từ {@code app.google.*}. {@code clientId} rỗng nghĩa là chưa cấu hình: đăng nhập Google báo "tạm thời không dùng được". */
@Validated
@ConfigurationProperties("app.google")
public record GoogleProperties(
        @DefaultValue("") String clientId,
        @NotBlank @DefaultValue("https://www.googleapis.com/oauth2/v3/certs") String jwkSetUri,
        /** Thời gian chờ tối đa khi tải JWKS của Google. */
        @NotNull @DefaultValue("5s") Duration timeout) {

    public boolean configured() {
        return clientId != null && !clientId.isBlank();
    }
}
