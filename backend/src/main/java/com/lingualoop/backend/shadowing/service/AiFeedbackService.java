package com.lingualoop.backend.shadowing.service;

import java.util.UUID;

import com.lingualoop.backend.shadowing.dto.AiFeedbackResponse;

public interface AiFeedbackService {

    /**
     * Nhận xét AI cho một lượt shadowing (UC-SHADOW-09). Lượt đã có nhận xét thì trả lại bản đã lưu và không trừ thêm
     * lượt; chưa có thì trừ một lượt {@code ai_feedback}, nhờ AI viết rồi lưu.
     */
    AiFeedbackResponse feedbackFor(UUID userId, long attemptId);
}
