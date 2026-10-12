package com.lingualoop.backend.lesson.service;

import com.lingualoop.backend.lesson.enums.PracticeMode;

import java.util.UUID;

public interface LessonProgressService {
    void recordActivity(UUID userId, UUID lessonId, PracticeMode mode, int timeSpentSec);
}
