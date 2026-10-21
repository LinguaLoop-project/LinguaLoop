package com.lingualoop.backend.lesson.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.lesson.repository.LessonModeProgressRepository;
import com.lingualoop.backend.lesson.repository.LessonProgressRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class LessonProgressServiceImpl implements LessonProgressService {

    private final LessonProgressRepository lessonProgressRepository;
    private final LessonModeProgressRepository modeProgressRepository;

    @Override
    @Transactional
    public void recordActivity(UUID userId, UUID lessonId, PracticeMode mode, int timeSpentSec) {
        // Dòng tiến độ bài phải có trước vì tiến độ theo chế độ tham chiếu tới nó (khoá ngoại).
        lessonProgressRepository.touch(userId, lessonId);
        modeProgressRepository.addTime(userId, lessonId, mode.name(), Math.max(timeSpentSec, 0));
        modeProgressRepository.completeIfAllSentencesAttempted(userId, lessonId, mode.name());
    }
}
