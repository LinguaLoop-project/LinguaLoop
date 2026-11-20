package com.lingualoop.backend.lesson.service;

import java.util.Collection;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.lesson.dto.response.ModeProgressResponse;
import com.lingualoop.backend.lesson.repository.LessonRepository;

import lombok.RequiredArgsConstructor;

/** Số câu và tiến độ luyện theo bài, tính theo lô cho danh sách bài (thư viện, Bài đã lưu). */
@Component
@RequiredArgsConstructor
class LessonProgress {

    static final ModeProgressResponse NONE = new ModeProgressResponse(0, 0);

    private final LessonRepository lessonRepository;

    Map<UUID, Long> sentenceCounts(Collection<UUID> lessonIds) {
        return lessonRepository.findSentenceCounts(lessonIds).stream()
                .collect(Collectors.toMap(LessonRepository.SentenceCount::getLessonId,
                        LessonRepository.SentenceCount::getSentenceCount));
    }

    /**
     * Tiến độ theo bài: phần trăm = số câu đã có lượt / tổng số câu của bài, theo từng chế độ. Một truy vấn theo lô
     * cho mọi bài trong danh sách; bài chưa có hoạt động nhận 0%.
     */
    Map<UUID, ModeProgressResponse> of(UUID userId, Map<UUID, Long> sentenceCounts) {
        if (userId == null || sentenceCounts.isEmpty()) {
            return Map.of();
        }
        Set<UUID> lessonIds = sentenceCounts.keySet();
        Map<UUID, Map<String, Long>> attempted = new HashMap<>();
        for (LessonRepository.AttemptedCount c : lessonRepository.countAttemptedSentences(userId, lessonIds)) {
            attempted.computeIfAbsent(c.getLessonId(), k -> new HashMap<>()).put(c.getMode(), c.getAttempted());
        }

        Map<UUID, ModeProgressResponse> result = new HashMap<>();
        for (UUID lessonId : lessonIds) {
            long total = sentenceCounts.getOrDefault(lessonId, 0L);
            Map<String, Long> byMode = attempted.getOrDefault(lessonId, Map.of());
            result.put(lessonId, new ModeProgressResponse(
                    percent(byMode.getOrDefault("dictation", 0L), total),
                    percent(byMode.getOrDefault("shadowing", 0L), total)));
        }
        return result;
    }

    private static int percent(long attempted, long total) {
        return total <= 0 ? 0 : (int) Math.min(100, Math.round(attempted * 100.0 / total));
    }
}
