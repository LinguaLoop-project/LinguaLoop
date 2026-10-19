package com.lingualoop.backend.shadowing.service;

import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;

import com.lingualoop.backend.ai.AiFeedbackGenerator;
import com.lingualoop.backend.ai.FeedbackRequest;
import com.lingualoop.backend.ai.GeneratedFeedback;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.shadowing.dto.AiFeedbackResponse;
import com.lingualoop.backend.shadowing.entity.AiFeedback;
import com.lingualoop.backend.shadowing.repository.AiFeedbackRepository;
import com.lingualoop.backend.subscription.dto.UsageTicket;
import com.lingualoop.backend.subscription.service.UsageService;
import com.lingualoop.backend.user.service.ConsentService;
import com.lingualoop.backend.user.service.ConsentService.ConsentType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Luồng: lượt của chính người gọi → đã đồng ý AI → đã có nhận xét thì trả lại → giữ chỗ lượt → nhờ AI → lưu.
 * Cố ý không có {@code @Transactional} ở đây để lời gọi Gemini không giữ kết nối DB.
 */
@Slf4j
@Service
@RequiredArgsConstructor
class AiFeedbackServiceImpl implements AiFeedbackService {

    static final String FEATURE = "ai_feedback";

    private final FeedbackRequestLoader loader;
    private final ConsentService consentService;
    private final AiFeedbackRepository repository;
    private final UsageService usageService;
    private final AiFeedbackGenerator generator;
    private final AiFeedbackRecorder recorder;

    @Override
    public AiFeedbackResponse feedbackFor(UUID userId, long attemptId) {
        FeedbackRequest request = loader.load(userId, attemptId);
        if (!consentService.hasConsent(userId, ConsentType.AI_PROCESSING)) {
            throw new BusinessException(ErrorCode.AI_CONSENT_REQUIRED);
        }
        var existing = repository.findByAttemptId(attemptId);
        if (existing.isPresent()) {
            return toResponse(existing.get(), true, userId);
        }

        UsageTicket ticket = usageService.tryConsume(userId, FEATURE);
        try {
            GeneratedFeedback generated = generator.generate(request);
            AiFeedback saved = recorder.save(attemptId, generated);
            return toResponse(saved, false, userId);
        } catch (DataIntegrityViolationException duplicate) {
            // Yêu cầu khác cho cùng lượt vừa lưu xong trước: dùng bản đó, không tính thêm lượt
            usageService.refund(userId, ticket);
            return repository.findByAttemptId(attemptId).map(f -> toResponse(f, true, userId)).orElseThrow(() -> duplicate);
        } catch (RuntimeException e) {
            // Chưa có nhận xét nào đến tay người học: trả lại lượt.
            usageService.refund(userId, ticket);
            throw e;
        }
    }

    private AiFeedbackResponse toResponse(AiFeedback feedback, boolean cached, UUID userId) {
        return new AiFeedbackResponse(feedback.getAttemptId(), feedback.getContent(), feedback.getCreatedAt(), cached,
                usageService.usageOf(userId, FEATURE));
    }
}
