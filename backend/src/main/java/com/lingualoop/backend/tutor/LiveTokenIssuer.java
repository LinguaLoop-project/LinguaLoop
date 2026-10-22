package com.lingualoop.backend.tutor;

import java.time.Instant;

/**
 * Cấp ephemeral token để trình duyệt kết nối thẳng tới mô hình realtime. Token khoá sẵn model, system prompt và tools
 * (ADR 0002).
 */
public interface LiveTokenIssuer {

    record LiveToken(String token, String model, Instant expiresAt) {
    }

    /** @throws RuntimeException khi không cấp được (chưa cấu hình, Gemini lỗi hoặc quá tải) */
    LiveToken issue(String systemPrompt);
}
