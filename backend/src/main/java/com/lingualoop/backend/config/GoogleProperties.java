package com.lingualoop.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import jakarta.validation.constraints.NotBlank;

/**
 * Bind từ {@code app.google.*} (authorization code flow). {@code clientId} hoặc {@code clientSecret} rỗng nghĩa là
 * chưa cấu hình: đăng nhập Google báo "tạm thời không dùng được", phần còn lại của app vẫn chạy.
 * {@code redirectUri} phải trùng đúng với redirect URI frontend gửi cho Google và đã khai trong Google Console.
 * Thời gian chờ gọi Google cấu hình ở {@code spring.cloud.openfeign.client.config.default}.
 */
@Validated
@ConfigurationProperties("app.google")
public record GoogleProperties(
        @DefaultValue("") String clientId,
        @DefaultValue("") String clientSecret,
        @NotBlank @DefaultValue("http://localhost:5173/authenticate") String redirectUri,
        /** Gốc URL đổi code lấy access token. */
        @NotBlank @DefaultValue("https://oauth2.googleapis.com") String oauthUrl,
        /** Gốc URL lấy thông tin người dùng (OpenID Connect userinfo). */
        @NotBlank @DefaultValue("https://openidconnect.googleapis.com") String userInfoUrl) {

    public boolean configured() {
        return clientId != null && !clientId.isBlank() && clientSecret != null && !clientSecret.isBlank();
    }
}
