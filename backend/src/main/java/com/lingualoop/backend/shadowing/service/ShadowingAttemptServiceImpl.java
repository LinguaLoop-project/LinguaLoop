package com.lingualoop.backend.shadowing.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.lesson.dto.LessonView;
import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.lesson.service.SentenceQueryService;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment;
import com.lingualoop.backend.shadowing.azure.PronunciationScoringService;
import com.lingualoop.backend.shadowing.dto.LatestAttemptResponse;
import com.lingualoop.backend.shadowing.dto.ShadowingAttemptResponse;
import com.lingualoop.backend.shadowing.repository.ShadowingAttemptRepository;
import com.lingualoop.backend.subscription.dto.UsageTicket;
import com.lingualoop.backend.subscription.service.UsageService;
import com.lingualoop.backend.user.service.ConsentService;
import com.lingualoop.backend.user.service.ConsentService.ConsentType;

import lombok.RequiredArgsConstructor;

/**
 * Luồng: kiểm tra đầu vào → giữ chỗ lượt → chấm bằng Azure → lưu. Cố ý không có {@code @Transactional}
 * ở đây để cuộc gọi Azure không giữ kết nối DB; phần lưu nằm trong {@link ShadowingAttemptRecorder}.
 */
@Service
@RequiredArgsConstructor
class ShadowingAttemptServiceImpl implements ShadowingAttemptService {

    static final String FEATURE = "shadowing_assess";

    private final SentenceQueryService sentenceQueryService;
    private final ConsentService consentService;
    private final UsageService usageService;
    private final PronunciationScoringService scoringService;
    private final ShadowingAttemptRecorder recorder;
    private final ShadowingAttemptRepository repository;

    @Override
    public ShadowingAttemptResponse assess(UUID userId, UUID sentenceId, byte[] wav) {
        WavAudio audio = WavAudio.parse(wav);
        SentenceView sentence = sentenceQueryService.findSentence(sentenceId)
                .orElseThrow(() -> new NotFoundException("Sentence not found"));
        sentenceQueryService.assertCanPractice(userId, sentence.lessonId());
        if (!consentService.hasConsent(userId, ConsentType.AI_PROCESSING)) {
            throw new BusinessException(ErrorCode.AI_CONSENT_REQUIRED);
        }

        UsageTicket ticket = usageService.tryConsume(userId, FEATURE);
        try {
            PronunciationAssessment assessment = scoringService.assess(wav, sentence.text());
            long attemptId = recorder.save(userId, sentence.lessonId(), sentenceId, assessment, audio.durationMs());
            return toResponse(attemptId, sentenceId, assessment, usageService.usageOf(userId, FEATURE));
        } catch (RuntimeException e) {
            // Chưa có kết quả nào đến tay người học: trả lại lượt.
            usageService.refund(userId, ticket);
            throw e;
        }
    }

    @Override
    public List<LatestAttemptResponse> latestByLesson(UUID userId, String lessonSlug) {
        LessonView lesson = sentenceQueryService.findLessonBySlug(lessonSlug)
                .orElseThrow(() -> new NotFoundException("Lesson not found"));
        sentenceQueryService.assertCanPractice(userId, lesson.id());
        return repository.findLatestByLesson(userId, lesson.id());
    }

    private static ShadowingAttemptResponse toResponse(long attemptId, UUID sentenceId,
            PronunciationAssessment a, com.lingualoop.backend.subscription.dto.FeatureUsage usage) {
        List<ShadowingAttemptResponse.WordResult> words = new java.util.ArrayList<>();
        int position = 0;
        for (PronunciationAssessment.WordResult w : a.words()) {
            words.add(new ShadowingAttemptResponse.WordResult(position++, w.word(), w.accuracyScore(),
                    ShadowingAttemptRecorder.outcomeOf(w.errorType()),
                    w.phonemes().stream()
                            .map(p -> new ShadowingAttemptResponse.PhonemeResult(p.symbol(), p.accuracyScore()))
                            .toList()));
        }
        return new ShadowingAttemptResponse(attemptId, sentenceId, a.pronunciationScore(), a.accuracyScore(),
                a.fluencyScore(), a.completenessScore(), a.prosodyScore(), a.recognizedText(), words, usage);
    }
}
