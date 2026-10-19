package com.lingualoop.backend.shadowing.service;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.ai.GeneratedFeedback;
import com.lingualoop.backend.shadowing.entity.AiFeedback;
import com.lingualoop.backend.shadowing.repository.AiFeedbackRepository;

import lombok.RequiredArgsConstructor;

/**
 * Lưu nhận xét trong một giao dịch ngắn, tách khỏi lời gọi Gemini (vài giây) để không giữ kết nối DB. Hai yêu cầu
 * đồng thời cho cùng một lượt: ràng buộc UNIQUE(attempt_id) làm bên chậm hơn ném {@code DataIntegrityViolationException}.
 */
@Service
@RequiredArgsConstructor
class AiFeedbackRecorder {

    private final AiFeedbackRepository repository;

    @Transactional
    public AiFeedback save(long attemptId, GeneratedFeedback feedback) {
        return repository.saveAndFlush(AiFeedback.of(attemptId, feedback.content(), feedback.model(),
                feedback.promptVersion(), feedback.inputTokens(), feedback.outputTokens()));
    }
}
