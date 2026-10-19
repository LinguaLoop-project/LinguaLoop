package com.lingualoop.backend.shadowing.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.ai.FeedbackRequest;
import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.lesson.service.SentenceQueryService;
import com.lingualoop.backend.shadowing.entity.AttemptPhoneme;
import com.lingualoop.backend.shadowing.entity.AttemptWord;
import com.lingualoop.backend.shadowing.entity.SentenceAttempt;
import com.lingualoop.backend.shadowing.repository.AttemptWordRepository;
import com.lingualoop.backend.shadowing.repository.PhonemeRepository;
import com.lingualoop.backend.shadowing.repository.ShadowingAttemptRepository;

import lombok.RequiredArgsConstructor;

/** Dựng dữ liệu đưa cho AI từ một Lượt shadowing đã lưu, kiểm tra lượt đó là của chính người gọi. */
@Service
@RequiredArgsConstructor
class FeedbackRequestLoader {

    private final ShadowingAttemptRepository attempts;
    private final AttemptWordRepository wordRepository;
    private final PhonemeRepository phonemes;
    private final SentenceQueryService sentenceQueryService;

    /** @throws NotFoundException lượt không tồn tại, không phải của người gọi, hoặc không phải lượt shadowing */
    @Transactional(readOnly = true)
    public FeedbackRequest load(UUID userId, long attemptId) {
        SentenceAttempt attempt = attempts.findById(attemptId)
                .filter(a -> a.getUserId().equals(userId) && a.getMode() == PracticeMode.shadowing)
                .orElseThrow(() -> new NotFoundException("Attempt not found"));
        String sentenceText = sentenceQueryService.findSentence(attempt.getSentenceId())
                .map(SentenceView::text)
                .orElseThrow(() -> new NotFoundException("Sentence not found"));

        Map<Short, String> symbols = new HashMap<>();
        phonemes.findAll().forEach(p -> symbols.put(p.getId(), p.getSymbol()));

        List<FeedbackRequest.Word> words = wordRepository.findByAttemptIds(List.of(attemptId)).stream()
                .map(w -> toWord(w, symbols))
                .toList();
        return new FeedbackRequest(sentenceText, value(attempt.getScore()), nullable(attempt.getAccuracyScore()),
                nullable(attempt.getFluencyScore()), nullable(attempt.getCompletenessScore()),
                nullable(attempt.getProsodyScore()), words);
    }

    private static FeedbackRequest.Word toWord(AttemptWord w, Map<Short, String> symbols) {
        List<FeedbackRequest.Phoneme> weak = w.getPhonemes().stream()
                .filter(p -> p.getAccuracyScore().doubleValue() < PronunciationHints.WEAK_BELOW)
                .map(p -> toPhoneme(p, symbols))
                .toList();
        return new FeedbackRequest.Word(w.getExpectedWord() != null ? w.getExpectedWord() : w.getActualWord(),
                value(w.getAccuracyScore()), w.getOutcome(), weak);
    }

    private static FeedbackRequest.Phoneme toPhoneme(AttemptPhoneme p, Map<Short, String> symbols) {
        return new FeedbackRequest.Phoneme(symbols.getOrDefault(p.getPhonemeId(), "?"), p.getAccuracyScore().doubleValue());
    }

    private static double value(java.math.BigDecimal score) {
        return score == null ? 0 : score.doubleValue();
    }

    private static Double nullable(java.math.BigDecimal score) {
        return score == null ? null : score.doubleValue();
    }
}
