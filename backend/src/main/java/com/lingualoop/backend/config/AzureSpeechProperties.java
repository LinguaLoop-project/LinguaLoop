package com.lingualoop.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Bind từ {@code app.azure.speech}. Key rỗng thì chấm phát âm báo không dùng được, app vẫn khởi động. */
@ConfigurationProperties("app.azure.speech")
public record AzureSpeechProperties(String key, String region) {

    public AzureSpeechProperties {
        key = key == null ? "" : key.trim();
        region = region == null || region.isBlank() ? "southeastasia" : region.trim();
    }

    public boolean configured() {
        return !key.isEmpty();
    }
}
