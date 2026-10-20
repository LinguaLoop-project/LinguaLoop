package com.lingualoop.backend.practice.service;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.practice.repository.PracticeProgressRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class PracticeProgressQueryServiceImpl implements PracticeProgressQueryService {

    private final PracticeProgressRepository progress;

    @Override
    public Map<UUID, Integer> countDictationSentencesDone(UUID userId, Collection<UUID> lessonIds) {
        Map<UUID, Integer> done = new HashMap<>();
        if (lessonIds.isEmpty()) {
            return done;
        }
        for (Object[] row : progress.countDictationSentencesByLesson(userId, lessonIds)) {
            done.put((UUID) row[0], ((Number) row[1]).intValue());
        }
        return done;
    }

    @Override
    public Map<UUID, BigDecimal> bestScores(UUID userId, Collection<UUID> sentenceIds) {
        Map<UUID, BigDecimal> best = new HashMap<>();
        if (sentenceIds.isEmpty()) {
            return best;
        }
        for (Object[] row : progress.maxScoreBySentence(userId, sentenceIds)) {
            best.put((UUID) row[0], (BigDecimal) row[1]);
        }
        return best;
    }
}
