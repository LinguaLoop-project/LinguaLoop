package com.lingualoop.backend.shadowing.service;

import java.util.UUID;
import java.util.function.Consumer;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.lingualoop.backend.ai.AiFeedbackGenerator;
import com.lingualoop.backend.ai.FeedbackRequest;
import com.lingualoop.backend.ai.GeneratedFeedback;
import com.lingualoop.backend.credit.AiFeature;
import com.lingualoop.backend.credit.CreditService;
import com.lingualoop.backend.shadowing.dto.AiFeedbackResponse;
import com.lingualoop.backend.shadowing.entity.AiFeedback;
import com.lingualoop.backend.shadowing.repository.AiFeedbackRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Luồng: lượt của chính người gọi → đã có nhận xét thì trả lại → kiểm credit → nhờ AI → lưu → trừ credit theo token.
 * Cố ý không có {@code @Transactional} ở đây để lời gọi Gemini không giữ kết nối DB.
 */
@Slf4j
@Service
@RequiredArgsConstructor
class AiFeedbackServiceImpl implements AiFeedbackService {

    private final FeedbackRequestLoader loader;
    private final AiFeedbackRepository repository;
    private final CreditService creditService;
    private final AiFeedbackGenerator generator;
    private final AiFeedbackRecorder recorder;

    @Override
    public AiFeedbackResponse feedbackFor(UUID userId, long attemptId) {
        return feedbackFor(userId, attemptId, null);
    }

    @Override
    public AiFeedbackResponse streamFeedbackFor(UUID userId, long attemptId, Consumer<String> onText) {
        return feedbackFor(userId, attemptId, onText);
    }

    /** @param onText null nếu không cần phát dần */
    private AiFeedbackResponse feedbackFor(UUID userId, long attemptId, Consumer<String> onText) {
        FeedbackRequest request = loader.load(userId, attemptId);
        var existing = repository.findByAttemptId(attemptId);
        if (existing.isPresent()) {
            if (onText != null) {
                onText.accept(existing.get().getContent());
            }
            return toResponse(existing.get(), true, userId);
        }

        creditService.requireCanStart(userId, AiFeature.SHADOWING_FEEDBACK);
        try {
            GeneratedFeedback generated = onText == null ? generator.generate(request) : generator.generate(request, onText);
            AiFeedback saved = recorder.save(attemptId, generated);
            creditService.charge(userId, AiFeature.SHADOWING_FEEDBACK, tokens(generated.inputTokens()),
                    tokens(generated.outputTokens()));
            return toResponse(saved, false, userId);
        } catch (DataIntegrityViolationException duplicate) {
            // Yêu cầu khác cho cùng lượt vừa lưu xong trước: dùng bản đó, không trừ thêm credit
            return repository.findByAttemptId(attemptId).map(f -> toResponse(f, true, userId)).orElseThrow(() -> duplicate);
        } catch (RuntimeException e) {
            // Chưa có nhận xét nào đến tay người học: không trừ credit, chỉ ghi nhận lỗi.
            creditService.logFailure(userId, AiFeature.SHADOWING_FEEDBACK, false);
            throw e;
        }
    }

    private static long tokens(Integer value) {
        return value == null ? 0 : value;
    }

    private AiFeedbackResponse toResponse(AiFeedback feedback, boolean cached, UUID userId) {
        return new AiFeedbackResponse(feedback.getAttemptId(), feedback.getContent(), feedback.getCreatedAt(), cached,
                creditService.balanceOf(userId));
    }
}
