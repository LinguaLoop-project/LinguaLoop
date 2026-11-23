package com.lingualoop.backend.lesson.service;

import java.util.HashSet;
import java.util.Set;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.lesson.dto.LessonStateCounts;
import com.lingualoop.backend.lesson.repository.LessonRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class LessonStatsQueryServiceImpl implements LessonStatsQueryService {

    private final LessonRepository lessons;

    @Override
    public LessonStateCounts stateCounts(UUID userId) {
        Set<UUID> done = new HashSet<>(lessons.findCompletedLessonIds(userId));
        Set<UUID> attempted = new HashSet<>(lessons.findAttemptedLessonIds(userId));
        attempted.removeAll(done);
        return new LessonStateCounts(attempted.size(), done.size());
    }
}
