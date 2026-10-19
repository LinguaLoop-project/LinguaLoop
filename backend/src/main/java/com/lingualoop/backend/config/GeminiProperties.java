package com.lingualoop.backend.config;

import java.time.Duration;

import org.springframework.boot.context.properties.ConfigurationProperties;

/** Bind từ {@code app.ai.gemini}. Key rỗng thì Nhận xét AI báo không dùng được, app vẫn khởi động. */
@ConfigurationProperties("app.ai.gemini")
public record GeminiProperties(String apiKey, String textModel, Duration timeout) {

    public GeminiProperties {
        apiKey = apiKey == null ? "" : apiKey.trim();
        textModel = textModel == null || textModel.isBlank() ? "gemini-2.5-flash" : textModel.trim();
        timeout = timeout == null ? Duration.ofSeconds(20) : timeout;
    }

    public boolean configured() {
        return !apiKey.isEmpty();
    }
}
