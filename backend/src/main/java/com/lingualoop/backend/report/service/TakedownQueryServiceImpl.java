package com.lingualoop.backend.report.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.report.enums.ReportTargetType;
import com.lingualoop.backend.report.repository.ModerationRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class TakedownQueryServiceImpl implements TakedownQueryService {

    private final ModerationRepository repository;

    @Override
    @Transactional(readOnly = true)
    public boolean isLessonTakenDown(UUID lessonId) {
        return repository.isTakenDown(ReportTargetType.SENTENCE, lessonId);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean isDeckTakenDown(UUID deckId) {
        return repository.isTakenDown(ReportTargetType.CARD, deckId);
    }
}
