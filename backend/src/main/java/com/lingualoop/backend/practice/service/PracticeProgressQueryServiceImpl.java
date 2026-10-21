package com.lingualoop.backend.practice.service;

import java.math.BigDecimal;
import java.util.Collection;
import java.util.EnumMap;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.repository.PracticeProgressRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class PracticeProgressQueryServiceImpl implements PracticeProgressQueryService {

    private final PracticeProgressRepository progress;

    @Override
    public Map<UUID, Map<PracticeMode, BigDecimal>> bestScores(UUID userId, Collection<UUID> sentenceIds) {
        Map<UUID, Map<PracticeMode, BigDecimal>> best = new HashMap<>();
        if (sentenceIds.isEmpty()) {
            return best;
        }
        for (Object[] row : progress.maxScoreBySentence(userId, sentenceIds)) {
            best.computeIfAbsent((UUID) row[0], k -> new EnumMap<>(PracticeMode.class))
                    .put(PracticeMode.valueOf((String) row[1]), (BigDecimal) row[2]);
        }
        return best;
    }
}
