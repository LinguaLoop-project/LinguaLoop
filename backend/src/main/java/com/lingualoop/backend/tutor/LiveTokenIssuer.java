package com.lingualoop.backend.tutor;

import java.time.Duration;
import java.time.Instant;
import java.util.List;

import com.google.genai.types.FunctionDeclaration;

/**
 * Cấp ephemeral token để trình duyệt kết nối thẳng tới mô hình realtime. Token khoá sẵn model, system prompt và tools
 * (ADR 0002).
 */
public interface LiveTokenIssuer {

    record LiveToken(String token, String model, Instant expiresAt) {
    }

    /**
     * Cấu hình bị khoá vào token.
     *
     * @param lifetime        thời hạn của token, phải đủ cho trần thời gian của phiên
     * @param compressContext bật nén ngữ cảnh để Gemini không cắt phiên chỉ có âm thanh quanh mốc 15 phút
     */
    record LiveSpec(String systemPrompt, List<FunctionDeclaration> tools, Duration lifetime, boolean compressContext) {
    }

    /** @throws RuntimeException khi không cấp được (chưa cấu hình, Gemini lỗi hoặc quá tải) */
    LiveToken issue(String systemPrompt);

    /**
     * Cấp token với cấu hình riêng (tool và thời hạn của tính năng khác gia sư theo câu). Mặc định trả về như
     * {@link #issue(String)}, để các bản giả trong test không phải cài đặt.
     */
    default LiveToken issueWith(LiveSpec spec) {
        return issue(spec.systemPrompt());
    }
}
