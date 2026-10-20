package com.lingualoop.backend.lesson.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.lesson.repository.LessonModeProgressRepository;
import com.lingualoop.backend.lesson.repository.LessonProgressRepository;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.practice.service.PracticeProgressQueryService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class LessonProgressServiceImpl implements LessonProgressService {

    private final LessonProgressRepository lessonProgress;
    private final LessonModeProgressRepository modeProgress;
    private final SentenceRepository sentences;
    private final PracticeProgressQueryService practiceProgress;

    /**
     * Ghi nhận một lượt luyện: bắt đầu bài và chế độ nếu chưa có, cộng thời gian. Nghe chép hoàn thành khi mọi câu
     * của bài đều có kết quả. Hoàn thành cả bài và hoàn thành shadowing chưa tính ở đây.
     */
    @Override
    @Transactional
    public void recordActivity(UUID userId, UUID lessonId, PracticeMode mode, int timeSpentSec) {
        lessonProgress.touch(userId, lessonId);
        modeProgress.addTime(userId, lessonId, mode.name(), Math.max(0, timeSpentSec));
        if (mode == PracticeMode.dictation && isDictationComplete(userId, lessonId)) {
            modeProgress.markCompleted(userId, lessonId, mode.name());
        }
    }

    private boolean isDictationComplete(UUID userId, UUID lessonId) {
        long total = sentences.countByLessonId(lessonId);
        int done = practiceProgress.countDictationSentencesDone(userId, List.of(lessonId)).getOrDefault(lessonId, 0);
        return total > 0 && done >= total;
    }
}
