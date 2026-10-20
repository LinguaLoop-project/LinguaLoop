package com.lingualoop.backend.shadowing.service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
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
import com.lingualoop.backend.shadowing.azure.ExpectedPhonemes;
import com.lingualoop.backend.shadowing.azure.PronunciationAssessment;
import com.lingualoop.backend.shadowing.azure.PronunciationScoringService;
import com.lingualoop.backend.shadowing.dto.LatestAttemptResponse;
import com.lingualoop.backend.shadowing.dto.ShadowingAttemptResponse;
import com.lingualoop.backend.shadowing.entity.AiFeedback;
import com.lingualoop.backend.shadowing.entity.AttemptPhoneme;
import com.lingualoop.backend.shadowing.entity.AttemptWord;
import com.lingualoop.backend.shadowing.repository.AiFeedbackRepository;
import com.lingualoop.backend.shadowing.repository.AttemptPhonemeRepository;
import com.lingualoop.backend.shadowing.repository.AttemptWordRepository;
import com.lingualoop.backend.shadowing.repository.PhonemeRepository;
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
    private final PhonemeRepository phonemeRepository;
    private final AttemptPhonemeRepository attemptPhonemeRepository;
    private final AiFeedbackRepository aiFeedbackRepository;

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
            return toResponse(userId, attemptId, sentence, assessment, usageService.usageOf(userId, FEATURE));
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
        List<Long> attemptIds = heads.stream().map(LatestHead::getAttemptId).toList();

        // Ký hiệu âm theo id, và mọi âm của bài để tra mẹo, video một lần (bấm âm nào cũng có)
        Map<Short, String> symbolById = new HashMap<>();
        phonemeRepository.findAll().forEach(p -> symbolById.put(p.getId(), p.getSymbol()));
        Map<Long, List<AttemptPhoneme>> phonemesByWord = new HashMap<>();
        Set<String> symbols = new HashSet<>();
        for (AttemptPhoneme p : attemptPhonemeRepository.findByAttemptIds(attemptIds)) {
            phonemesByWord.computeIfAbsent(p.getWord().getId(), k -> new ArrayList<>()).add(p);
            symbols.add(symbolById.getOrDefault(p.getPhonemeId(), "?"));
        }

        // Âm mẫu theo từng từ của từng câu, để ghép với âm đã lưu (theo vị trí âm trong từ)
        Map<UUID, List<List<String>>> expectedBySentence = new HashMap<>();
        for (SentenceView sv : sentenceQueryService.findSentences(lesson.id())) {
            expectedBySentence.put(sv.id(), ExpectedPhonemes.ofSentence(sv.text(), sv.ipa()));
        }
        Map<Long, UUID> sentenceByAttempt = new HashMap<>();
        heads.forEach(h -> sentenceByAttempt.put(h.getAttemptId(), h.getSentenceId()));
        Map<Long, List<String>> expectedByWord = new HashMap<>();
        Map<Long, Integer> refIndexByAttempt = new HashMap<>();
        List<AttemptWord> words = wordRepository.findByAttemptIds(attemptIds);
        for (AttemptWord w : words) {
            if (w.getExpectedWord() == null) {
                continue; // từ thừa không có trong câu mẫu
            }
            int ref = refIndexByAttempt.merge(w.getAttempt().getId(), 1, Integer::sum) - 1;
            List<List<String>> sentenceExpected = expectedBySentence.get(sentenceByAttempt.get(w.getAttempt().getId()));
            if (sentenceExpected != null && ref < sentenceExpected.size() && sentenceExpected.get(ref) != null) {
                expectedByWord.put(w.getId(), sentenceExpected.get(ref));
                symbols.addAll(sentenceExpected.get(ref));
            }
        }
        Map<String, PronunciationHints.Hint> hintBySymbol = hintsFor(userId, symbols);

        Map<Long, List<ShadowingAttemptResponse.WordResult>> wordsByAttempt = new HashMap<>();
        for (AttemptWord w : words) {
            List<ShadowingAttemptResponse.PhonemeResult> phonemes = new ArrayList<>();
            List<AttemptPhoneme> stored = phonemesByWord.getOrDefault(w.getId(), List.of());
            // Âm không chuyển được không được lưu nhưng vị trí vẫn giữ: số âm nghe được là vị trí lớn nhất + 1
            int heardCount = stored.stream().mapToInt(p -> p.getPosition() + 1).max().orElse(0);
            List<String> expected = ExpectedPhonemes.align(expectedByWord.get(w.getId()), heardCount);
            for (AttemptPhoneme p : stored) {
                String symbol = symbolById.getOrDefault(p.getPhonemeId(), "?");
                double accuracy = p.getAccuracyScore().doubleValue();
                String target = ExpectedPhonemes.reconcile(symbol, expected.get(p.getPosition()));
                PronunciationHints.Hint hint = hintBySymbol.get(target != null ? target : symbol);
                phonemes.add(new ShadowingAttemptResponse.PhonemeResult(symbol, target, accuracy,
                        hint == null ? null : hint.tip(), hint == null ? null : hint.mouthVideo()));
            }
            wordsByAttempt.computeIfAbsent(w.getAttempt().getId(), k -> new ArrayList<>())
                    .add(new ShadowingAttemptResponse.WordResult(w.getPosition(),
                            w.getExpectedWord() != null ? w.getExpectedWord() : w.getActualWord(),
                            w.getAccuracyScore().doubleValue(), w.getOutcome(), phonemes));
        }

        Map<Long, AiFeedback> feedbackByAttempt = new HashMap<>();
        aiFeedbackRepository.findByAttemptIdIn(attemptIds).forEach(f -> feedbackByAttempt.put(f.getAttemptId(), f));

        return heads.stream()
                .map(h -> new LatestAttemptResponse(h.getSentenceId(), h.getAttemptId(), h.getScore().doubleValue(),
                        nullable(h.getAccuracyScore()), nullable(h.getFluencyScore()),
                        nullable(h.getCompletenessScore()), nullable(h.getProsodyScore()), h.getAttemptedAt(),
                        h.getBestScore().doubleValue(), h.getAttemptCount().intValue(),
                        wordsByAttempt.getOrDefault(h.getAttemptId(), List.of()),
                        savedFeedback(feedbackByAttempt.get(h.getAttemptId()))))
                .toList();
    }

    private static Double nullable(BigDecimal score) {
        return score == null ? null : score.doubleValue();
    }

    private static LatestAttemptResponse.SavedAiFeedback savedFeedback(AiFeedback feedback) {
        return feedback == null ? null
                : new LatestAttemptResponse.SavedAiFeedback(feedback.getContent(), feedback.getCreatedAt());
    }

    private ShadowingAttemptResponse toResponse(UUID userId, long attemptId, SentenceView sentence,
            PronunciationAssessment a, FeatureUsage usage) {
        // Ký hiệu trả về cùng hệ với IPA mẫu của câu (bảng phonemes); âm chưa chuyển được giữ nguyên ký hiệu Azure
        List<List<String>> symbols = a.words().stream()
                .map(w -> AzurePhonemeMapper.toTableSymbols(
                        w.phonemes().stream().map(PronunciationAssessment.PhonemeResult::symbol).toList()))
                .toList();
        // Âm mẫu theo từ của câu; Azure có thể chèn từ thừa nên chỉ đếm các từ không phải từ thừa
        List<List<String>> reference = ExpectedPhonemes.ofSentence(sentence.text(), sentence.ipa());
        List<List<String>> expectedByWord = new ArrayList<>();
        int refIndex = 0;
        for (PronunciationAssessment.WordResult word : a.words()) {
            List<String> ref = null;
            if (word.errorType() != PronunciationAssessment.ErrorType.INSERTION) {
                ref = reference != null && refIndex < reference.size() ? reference.get(refIndex) : null;
                refIndex++;
            }
            expectedByWord.add(ExpectedPhonemes.align(ref, word.phonemes().size()));
        }
        Set<String> all = new HashSet<>();
        symbols.forEach(list -> list.stream().filter(Objects::nonNull).forEach(all::add));
        expectedByWord.forEach(list -> list.stream().filter(Objects::nonNull).forEach(all::add));
        Map<String, PronunciationHints.Hint> hints = hintsFor(userId, all);

        List<ShadowingAttemptResponse.WordResult> words = new ArrayList<>();
        int position = 0;
        for (int w = 0; w < a.words().size(); w++) {
            PronunciationAssessment.WordResult word = a.words().get(w);
            List<ShadowingAttemptResponse.PhonemeResult> phonemes = new ArrayList<>();
            for (int i = 0; i < word.phonemes().size(); i++) {
                PronunciationAssessment.PhonemeResult p = word.phonemes().get(i);
                String mapped = symbols.get(w).get(i);
                String target = ExpectedPhonemes.reconcile(mapped, expectedByWord.get(w).get(i));
                String hintKey = target != null ? target : mapped;
                PronunciationHints.Hint hint = hintKey != null ? hints.get(hintKey) : null;
                phonemes.add(new ShadowingAttemptResponse.PhonemeResult(mapped != null ? mapped : p.symbol(), target,
                        p.accuracyScore(), hint == null ? null : hint.tip(), hint == null ? null : hint.mouthVideo()));
            }
            words.add(new ShadowingAttemptResponse.WordResult(position++, word.word(), word.accuracyScore(),
                    ShadowingAttemptRecorder.outcomeOf(word.errorType()), phonemes));
        }
        return new ShadowingAttemptResponse(attemptId, sentence.id(), a.pronunciationScore(), a.accuracyScore(),
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
