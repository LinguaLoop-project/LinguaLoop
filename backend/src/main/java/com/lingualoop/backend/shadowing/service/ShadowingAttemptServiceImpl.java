package com.lingualoop.backend.shadowing.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.lesson.dto.LessonView;
import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.lesson.service.SentenceQueryService;
import com.lingualoop.backend.shadowing.azure.AzurePhonemeMapper;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment;
import com.lingualoop.backend.shadowing.azure.PronunciationScoringService;
import com.lingualoop.backend.shadowing.dto.LatestAttemptResponse;
import com.lingualoop.backend.shadowing.dto.ShadowingAttemptResponse;
import com.lingualoop.backend.practice.entity.SentenceAttemptWord;
import com.lingualoop.backend.shadowing.repository.AttemptWordRepository;
import com.lingualoop.backend.shadowing.repository.ShadowingAttemptRepository;
import com.lingualoop.backend.shadowing.repository.ShadowingAttemptRepository.LatestHead;
import com.lingualoop.backend.subscription.dto.FeatureUsage;
import com.lingualoop.backend.subscription.dto.UsageTicket;
import com.lingualoop.backend.subscription.service.UsageService;
import com.lingualoop.backend.user.service.ConsentService;
import com.lingualoop.backend.user.service.ConsentService.ConsentType;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Luồng: kiểm tra đầu vào → giữ chỗ lượt → chấm bằng Azure → lưu. Cố ý không có {@code @Transactional}
 * ở đây để cuộc gọi Azure không giữ kết nối DB; phần lưu nằm trong {@link ShadowingAttemptRecorder}.
 */
@Slf4j
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
    private final AttemptWordRepository wordRepository;
    private final PronunciationHints hints;

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
            return toResponse(userId, attemptId, sentenceId, assessment, usageService.usageOf(userId, FEATURE));
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
        List<LatestHead> heads = repository.findLatestByLesson(userId, lesson.id());
        if (heads.isEmpty()) {
            return List.of();
        }
        Map<Long, List<LatestAttemptResponse.WordSummary>> wordsByAttempt = new HashMap<>();
        for (SentenceAttemptWord w : wordRepository.findByAttemptIds(heads.stream().map(LatestHead::getAttemptId).toList())) {
            wordsByAttempt.computeIfAbsent(w.getAttemptId(), k -> new ArrayList<>())
                    .add(new LatestAttemptResponse.WordSummary(w.getPosition(),
                            w.getExpectedWord() != null ? w.getExpectedWord() : w.getActualWord(),
                            w.getAccuracyScore().doubleValue(), w.getOutcome().name()));
        }
        return heads.stream()
                .map(h -> new LatestAttemptResponse(h.getSentenceId(), h.getAttemptId(), h.getScore().doubleValue(),
                        h.getAttemptedAt(), h.getBestScore().doubleValue(), h.getAttemptCount().intValue(),
                        wordsByAttempt.getOrDefault(h.getAttemptId(), List.of())))
                .toList();
    }

    private ShadowingAttemptResponse toResponse(UUID userId, long attemptId, UUID sentenceId,
            PronunciationAssessment a, FeatureUsage usage) {
        // Ký hiệu trả về cùng hệ với IPA mẫu của câu (bảng phonemes); âm chưa chuyển được giữ nguyên ký hiệu Azure
        List<List<String>> symbols = a.words().stream()
                .map(w -> AzurePhonemeMapper.toTableSymbols(
                        w.phonemes().stream().map(PronunciationAssessment.PhonemeResult::symbol).toList()))
                .toList();
        Set<String> weak = new HashSet<>();
        for (int w = 0; w < a.words().size(); w++) {
            for (int i = 0; i < symbols.get(w).size(); i++) {
                if (symbols.get(w).get(i) != null && a.words().get(w).phonemes().get(i).accuracyScore()
                        < PronunciationHints.WEAK_BELOW) {
                    weak.add(symbols.get(w).get(i));
                }
            }
        }
        Map<String, PronunciationHints.Hint> hints = hintsFor(userId, weak);

        List<ShadowingAttemptResponse.WordResult> words = new ArrayList<>();
        int position = 0;
        for (int w = 0; w < a.words().size(); w++) {
            PronunciationAssessment.WordResult word = a.words().get(w);
            List<ShadowingAttemptResponse.PhonemeResult> phonemes = new ArrayList<>();
            for (int i = 0; i < word.phonemes().size(); i++) {
                PronunciationAssessment.PhonemeResult p = word.phonemes().get(i);
                String mapped = symbols.get(w).get(i);
                PronunciationHints.Hint hint = p.accuracyScore() < PronunciationHints.WEAK_BELOW && mapped != null
                        ? hints.get(mapped) : null;
                phonemes.add(new ShadowingAttemptResponse.PhonemeResult(mapped != null ? mapped : p.symbol(),
                        p.accuracyScore(), hint == null ? null : hint.tip(), hint == null ? null : hint.mouthVideo()));
            }
            words.add(new ShadowingAttemptResponse.WordResult(position++, word.word(), word.accuracyScore(),
                    ShadowingAttemptRecorder.outcomeOf(word.errorType()), phonemes));
        }
        return new ShadowingAttemptResponse(attemptId, sentenceId, a.pronunciationScore(), a.accuracyScore(),
                a.fluencyScore(), a.completenessScore(), a.prosodyScore(), a.recognizedText(), words, usage);
    }

    /** Mẹo và video chỉ là phần thêm: lỗi ở đây không được làm mất kết quả đã lưu (và đã trừ lượt) của người học. */
    private Map<String, PronunciationHints.Hint> hintsFor(UUID userId, Set<String> weakSymbols) {
        try {
            return hints.hintsFor(userId, weakSymbols);
        } catch (RuntimeException e) {
            log.warn("Không lấy được mẹo sửa âm, bỏ qua", e);
            return Map.of();
        }
    }
}
