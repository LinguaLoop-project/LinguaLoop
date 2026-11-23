package com.lingualoop.backend.vocab.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.vocab.dto.VocabStatsView;
import com.lingualoop.backend.vocab.repository.VocabStatsRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class VocabStatsQueryServiceImpl implements VocabStatsQueryService {

    private final VocabStatsRepository stats;

    @Override
    public Set<LocalDate> activeDays(UUID userId) {
        return stats.activeDays(userId);
    }

    @Override
    public VocabStatsView.CardCounts cardCounts(UUID userId) {
        return stats.cardCounts(userId);
    }

    @Override
    public VocabStatsView.AnswerStats answerStats(UUID userId, Instant since) {
        return stats.answerStats(userId, since);
    }

    @Override
    public List<VocabStatsView.Session> sessions(UUID userId, Instant since, int limit) {
        return stats.sessions(userId, since, limit);
    }

    @Override
    public long countSessions(UUID userId, Instant since) {
        return stats.countSessions(userId, since);
    }
}
