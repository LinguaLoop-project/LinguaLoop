package com.lingualoop.backend.practice.service;

import java.time.Instant;
import java.time.LocalDate;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.PracticeSessionDetailView;
import com.lingualoop.backend.practice.dto.PracticeSessionView;
import com.lingualoop.backend.practice.dto.SentenceCountsView;
import com.lingualoop.backend.practice.dto.WordClassErrorView;
import com.lingualoop.backend.practice.dto.WrongWordView;
import com.lingualoop.backend.practice.repository.PracticeStatsRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class PracticeStatsQueryServiceImpl implements PracticeStatsQueryService {

    private final PracticeStatsRepository stats;

    @Override
    public Set<LocalDate> activeDays(UUID userId) {
        return stats.activeDays(userId);
    }

    @Override
    public SentenceCountsView sentenceCounts(UUID userId, Instant since) {
        return stats.sentenceCounts(userId, since);
    }

    @Override
    public Map<LocalDate, Long> activityByDay(UUID userId, Instant since) {
        return stats.activityByDay(userId, since);
    }

    @Override
    public List<WrongWordView> topWrongWords(UUID userId, Instant since, int limit) {
        return stats.topWrongWords(userId, since, limit);
    }

    @Override
    public long sentencesBetween(UUID userId, Instant from, Instant until) {
        return stats.sentencesBetween(userId, from, until);
    }

    @Override
    public Map<String, UUID> latestOpenLessonByWordClass(UUID userId, boolean pro) {
        return stats.latestOpenLessonByWordClass(userId, pro);
    }

    @Override
    public List<WordClassErrorView> dictationErrors(UUID userId, Instant since) {
        return stats.dictationErrors(userId, since);
    }

    @Override
    public List<PracticeSessionView> practiceSessions(UUID userId, Instant since, Collection<PracticeMode> modes,
            int limit) {
        return modes.isEmpty() ? List.of() : stats.practiceSessions(userId, since, names(modes), limit);
    }

    @Override
    public long countPracticeSessions(UUID userId, Instant since, Collection<PracticeMode> modes) {
        return modes.isEmpty() ? 0 : stats.countPracticeSessions(userId, since, names(modes));
    }

    @Override
    public Optional<PracticeSessionDetailView> practiceSessionDetail(UUID userId, UUID lessonId, PracticeMode mode,
            LocalDate day) {
        return stats.practiceSessionDetail(userId, lessonId, mode.name(), day);
    }

    private static List<String> names(Collection<PracticeMode> modes) {
        return modes.stream().map(PracticeMode::name).toList();
    }
}
