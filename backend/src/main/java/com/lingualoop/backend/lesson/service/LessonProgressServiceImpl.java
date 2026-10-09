package com.lingualoop.backend.lesson.service;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import org.springframework.stereotype.Service;
import lombok.extern.slf4j.Slf4j;

import java.util.UUID;

@Slf4j
@Service
public class LessonProgressServiceImpl implements LessonProgressService {

    @Override
    public void recordActivity(UUID userId, UUID lessonId, PracticeMode mode, int timeSpentSec) {
        // Stub implementation
        log.info("Recorded activity for user: {}, lesson: {}, mode: {}, timeSpent: {}s", userId, lessonId, mode, timeSpentSec);
    }
}
