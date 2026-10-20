package com.lingualoop.backend.shadowing.service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.NotFoundException;
import com.lingualoop.backend.lesson.dto.SentenceView;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.lesson.service.SentenceQueryService;
import com.lingualoop.backend.shadowing.azure.ExpectedPhonemes;
import com.lingualoop.backend.shadowing.dto.AttemptSnapshot;
import com.lingualoop.backend.shadowing.entity.AttemptPhoneme;
import com.lingualoop.backend.shadowing.entity.AttemptWord;
import com.lingualoop.backend.shadowing.entity.SentenceAttempt;
import com.lingualoop.backend.shadowing.repository.AttemptPhonemeRepository;
import com.lingualoop.backend.shadowing.repository.AttemptWordRepository;
import com.lingualoop.backend.shadowing.repository.PhonemeRepository;
import com.lingualoop.backend.shadowing.repository.ShadowingAttemptRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class AttemptSnapshotsImpl implements AttemptSnapshots {

    private final ShadowingAttemptRepository attempts;
    private final AttemptWordRepository wordRepository;
    private final AttemptPhonemeRepository phonemeRepository;
    private final PhonemeRepository phonemes;
    private final SentenceQueryService sentenceQueryService;

    @Override
    @Transactional(readOnly = true)
    public AttemptSnapshot load(UUID userId, long attemptId) {
        SentenceAttempt attempt = attempts.findById(attemptId)
                .filter(a -> a.getUserId().equals(userId) && a.getMode() == PracticeMode.shadowing)
                .orElseThrow(() -> new NotFoundException("Attempt not found"));
        return snapshots(List.of(attempt)).get(0);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AttemptSnapshot> previous(UUID userId, long attemptId, int limit) {
        SentenceAttempt current = attempts.findById(attemptId)
                .filter(a -> a.getUserId().equals(userId) && a.getMode() == PracticeMode.shadowing)
                .orElseThrow(() -> new NotFoundException("Attempt not found"));
        UUID lessonId = sentenceQueryService.findSentence(current.getSentenceId())
                .map(SentenceView::lessonId).orElseThrow(() -> new NotFoundException("Sentence not found"));
        List<Long> ids = attempts.findPreviousIds(userId, lessonId, attemptId, limit);
        if (ids.isEmpty()) {
            return List.of();
        }
        Map<Long, SentenceAttempt> byId = new HashMap<>();
        attempts.findAllById(ids).forEach(a -> byId.put(a.getId(), a));
        return snapshots(ids.stream().map(byId::get).toList());
    }

    @Override
    @Transactional(readOnly = true)
    public int countSince(UUID userId, UUID lessonId, long afterAttemptId, long uptoAttemptId) {
        return attempts.countBetween(userId, lessonId, afterAttemptId, uptoAttemptId);
    }

    /** Dựng kết quả theo âm đích cho một nhóm lượt, giữ thứ tự đầu vào. */
    private List<AttemptSnapshot> snapshots(List<SentenceAttempt> list) {
        List<Long> ids = list.stream().map(SentenceAttempt::getId).toList();
        Map<Short, String> symbolById = new HashMap<>();
        phonemes.findAll().forEach(p -> symbolById.put(p.getId(), p.getSymbol()));

        Map<Long, List<AttemptPhoneme>> phonemesByWord = new HashMap<>();
        phonemeRepository.findByAttemptIds(ids).forEach(
                p -> phonemesByWord.computeIfAbsent(p.getWord().getId(), k -> new ArrayList<>()).add(p));
        Map<Long, List<AttemptWord>> wordsByAttempt = new HashMap<>();
        wordRepository.findByAttemptIds(ids).forEach(
                w -> wordsByAttempt.computeIfAbsent(w.getAttempt().getId(), k -> new ArrayList<>()).add(w));

        List<AttemptSnapshot> result = new ArrayList<>();
        for (SentenceAttempt attempt : list) {
            SentenceView sentence = sentenceQueryService.findSentence(attempt.getSentenceId())
                    .orElseThrow(() -> new NotFoundException("Sentence not found"));
            List<AttemptWord> words = wordsByAttempt.getOrDefault(attempt.getId(), List.of());
            Map<Long, List<String>> expected = PhonemeTargets.expectedByWordId(sentence, words);

            List<AttemptSnapshot.Word> out = new ArrayList<>();
            for (AttemptWord w : words) {
                List<AttemptPhoneme> stored = phonemesByWord.getOrDefault(w.getId(), List.of());
                List<String> recomputed = ExpectedPhonemes.align(expected.get(w.getId()), PhonemeTargets.heardCount(stored));
                List<AttemptSnapshot.Phoneme> ph = new ArrayList<>();
                for (AttemptPhoneme p : stored) {
                    String heard = PhonemeTargets.reportedSymbol(p, symbolById);
                    String target = PhonemeTargets.targetSymbol(p, symbolById, recomputed);
                    double accuracy = p.getAccuracyScore().doubleValue();
                    ph.add(new AttemptSnapshot.Phoneme(target != null ? target : heard, accuracy,
                            PhonemeRules.needsFix(accuracy, heard, target), PhonemeRules.mismatch(heard, target)));
                }
                out.add(new AttemptSnapshot.Word(w.getExpectedWord() != null ? w.getExpectedWord() : w.getActualWord(),
                        w.getAccuracyScore() == null ? 0 : w.getAccuracyScore().doubleValue(), w.getOutcome(), ph));
            }
            result.add(new AttemptSnapshot(attempt.getId(), sentence.lessonId(), sentence.id(), sentence.text(),
                    sentence.ipa(), attempt.getAccuracyScore() == null ? 0 : attempt.getAccuracyScore().doubleValue(), out));
        }
        return result;
    }
}
