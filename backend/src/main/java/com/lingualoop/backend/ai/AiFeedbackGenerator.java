package com.lingualoop.backend.ai;

/** Viết nhận xét về một lượt shadowing bằng AI. Tách interface để test thay bằng bản giả, không gọi Gemini thật. */
public interface AiFeedbackGenerator {

    /**
     * @throws com.lingualoop.backend.common.exception.BusinessException {@code AI_FEEDBACK_UNAVAILABLE} khi dịch vụ
     *         lỗi, quá thời gian chờ, chưa cấu hình, hoặc mạch đang mở
     */
    GeneratedFeedback generate(FeedbackRequest request);
}
