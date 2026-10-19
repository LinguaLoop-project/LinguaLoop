package com.lingualoop.backend.shadowing.service;

import java.util.UUID;
import java.util.function.Consumer;

import com.lingualoop.backend.shadowing.dto.AiFeedbackResponse;

public interface AiFeedbackService {

    /**
     * Nhận xét AI cho một lượt shadowing (UC-SHADOW-09). Lượt đã có nhận xét thì trả lại bản đã lưu và không trừ thêm
     * lượt; chưa có thì trừ một lượt {@code ai_feedback}, nhờ AI viết rồi lưu.
     */
    AiFeedbackResponse feedbackFor(UUID userId, long attemptId);

    /**
     * Như {@link #feedbackFor} nhưng báo từng đoạn chữ qua {@code onText} ngay khi AI viết (UC-SHADOW-09 phát dần).
     * Nhận xét đã lưu sẽ được báo một lần với cả nội dung. Lỗi xảy ra trước khi có đoạn chữ đầu tiên ném
     * {@code BusinessException} như bình thường; lỗi sau đó vẫn ném ra và lượt được hoàn.
     */
    AiFeedbackResponse streamFeedbackFor(UUID userId, long attemptId, Consumer<String> onText);
}
