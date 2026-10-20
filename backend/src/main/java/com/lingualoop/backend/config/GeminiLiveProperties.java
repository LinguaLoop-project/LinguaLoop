package com.lingualoop.backend.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Bind từ {@code app.ai.gemini-live}: model realtime của Phiên gia sư (bản preview, tên có thể đổi) và giọng nói. Key
 * dùng chung với {@link GeminiProperties}.
 */
@ConfigurationProperties("app.ai.gemini-live")
public record GeminiLiveProperties(String model, String voice) {

    public GeminiLiveProperties {
        model = model == null || model.isBlank() ? "gemini-3.1-flash-live-preview" : model.trim();
        voice = voice == null ? "" : voice.trim();
    }
}
