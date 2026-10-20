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
import com.lingualoop.backend.shadowing.azure.ExpectedPhonemes;
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
        SentenceView sentence = sentenceQueryService.findSentence(attempt.getSentenceId())
                .orElseThrow(() -> new NotFoundException("Sentence not found"));

        Map<Short, String> symbols = new HashMap<>();
        phonemes.findAll().forEach(p -> symbols.put(p.getId(), p.getSymbol()));

        List<AttemptWord> attemptWords = wordRepository.findByAttemptIds(List.of(attemptId));
        Map<Long, List<String>> expectedByWord = PhonemeTargets.expectedByWordId(sentence, attemptWords);
        List<FeedbackRequest.Word> words = attemptWords.stream()
                .map(w -> toWord(w, symbols, expectedByWord.get(w.getId())))
                .toList();
        return new FeedbackRequest(sentence.text(), value(attempt.getScore()), nullable(attempt.getAccuracyScore()),
                nullable(attempt.getFluencyScore()), nullable(attempt.getCompletenessScore()),
                nullable(attempt.getProsodyScore()), words);
    }

    private static FeedbackRequest.Word toWord(AttemptWord w, Map<Short, String> symbols, List<String> expectedWord) {
        List<AttemptPhoneme> stored = w.getPhonemes();
        List<String> recomputed = ExpectedPhonemes.align(expectedWord, PhonemeTargets.heardCount(stored));
        List<FeedbackRequest.Phoneme> weak = stored.stream()
                .map(p -> toPhoneme(p, symbols, PhonemeTargets.targetSymbol(p, symbols, recomputed)))
                .filter(p -> PhonemeRules.needsFix(p.accuracy(), p.symbol(), p.expected() == null ? p.symbol() : p.expected()))
                .toList();
        return new FeedbackRequest.Word(w.getExpectedWord() != null ? w.getExpectedWord() : w.getActualWord(),
                value(w.getAccuracyScore()), w.getOutcome(), weak);
    }

    /** {@code expected} chỉ được giữ khi khác âm Azure báo, để lời nhắc ngắn gọn. */
    private static FeedbackRequest.Phoneme toPhoneme(AttemptPhoneme p, Map<Short, String> symbols, String expected) {
        String symbol = PhonemeTargets.reportedSymbol(p, symbols);
        return new FeedbackRequest.Phoneme(symbol, expected != null && !expected.equals(symbol) ? expected : null,
                p.getAccuracyScore().doubleValue());
    }

    private static double value(java.math.BigDecimal score) {
        return score == null ? 0 : score.doubleValue();
    }

    private static Double nullable(java.math.BigDecimal score) {
        return score == null ? null : score.doubleValue();
    }
}
