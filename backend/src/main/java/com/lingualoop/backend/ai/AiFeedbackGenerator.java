package com.lingualoop.backend.ai;

import java.util.function.Consumer;

/** Viết nhận xét về một lượt shadowing bằng AI. Tách interface để test thay bằng bản giả, không gọi Gemini thật. */
public interface AiFeedbackGenerator {

    /**
     * @throws com.lingualoop.backend.common.exception.BusinessException {@code AI_FEEDBACK_UNAVAILABLE} khi dịch vụ
     *         lỗi, quá thời gian chờ, chưa cấu hình, hoặc mạch đang mở
     */
    GeneratedFeedback generate(FeedbackRequest request);

    /**
     * Như {@link #generate(FeedbackRequest)} nhưng báo từng đoạn chữ qua {@code onText} ngay khi AI viết, để giao diện
     * hiện chữ chạy ra thay vì chờ cả đoạn. Mặc định (bản không hỗ trợ phát dần) gọi một lần với cả nhận xét.
     * Nếu {@code onText} ném {@link java.io.UncheckedIOException} (người học đã đóng trang) thì dừng và ném lại.
     */
    default GeneratedFeedback generate(FeedbackRequest request, Consumer<String> onText) {
        GeneratedFeedback feedback = generate(request);
        onText.accept(feedback.content());
        return feedback;
    }
}
