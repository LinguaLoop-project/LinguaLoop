package com.lingualoop.backend.shadowing.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.shadowing.dto.LatestAttemptResponse;
import com.lingualoop.backend.shadowing.dto.ShadowingAttemptResponse;

public interface ShadowingAttemptService {

    /** Chấm một bản ghi WAV cho một câu và lưu Lượt shadowing (UC-SHADOW-01). */
    ShadowingAttemptResponse assess(UUID userId, UUID sentenceId, byte[] wav);

    /** Lượt mới nhất của từng câu đã đọc trong bài (UC-SHADOW-03). */
    List<LatestAttemptResponse> latestByLesson(UUID userId, String lessonSlug);
}
