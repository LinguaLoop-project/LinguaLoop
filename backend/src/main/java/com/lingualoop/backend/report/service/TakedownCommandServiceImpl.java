package com.lingualoop.backend.report.service;

import java.time.Clock;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.report.enums.ReportTargetType;
import com.lingualoop.backend.report.repository.ModerationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class TakedownCommandServiceImpl implements TakedownCommandService {

    private final TakedownMarker marker;
    private final ModerationRepository repository;
    private final Clock clock;

    @Override
    @Transactional
    public void markDeckByAdmin(UUID adminId, UUID deckId, String deckName, UUID ownerId, String reason) {
        marker.mark(adminId, ReportTargetType.CARD, deckId, deckName, ownerId, reason,
                ModerationRepository.SOURCE_MANUAL, List.of(), clock.instant());
    }

    @Override
    @Transactional
    public void markLessonByAdmin(UUID adminId, UUID lessonId, String lessonTitle, UUID ownerId, String reason) {
        marker.mark(adminId, ReportTargetType.SENTENCE, lessonId, lessonTitle, ownerId, reason,
                ModerationRepository.SOURCE_MANUAL, List.of(), clock.instant());
    }

    @Override
    @Transactional
    public void cancelPendingForDeletedDeck(UUID deckId) {
        repository.cancelPending(ReportTargetType.CARD, deckId, clock.instant());
    }

    @Override
    @Transactional
    public void cancelPendingForDeletedLesson(UUID lessonId) {
        repository.cancelPending(ReportTargetType.SENTENCE, lessonId, clock.instant());
    }
}
