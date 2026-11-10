package com.lingualoop.backend.shadowing.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.shadowing.dto.LatestAttemptResponse;
import com.lingualoop.backend.shadowing.dto.ShadowingAttemptResponse;
import com.lingualoop.backend.shadowing.dto.ShadowingHistoryItem;

public interface ShadowingAttemptService {

    /** Chấm một bản ghi WAV cho một câu và lưu Lượt shadowing (UC-SHADOW-01). */
    ShadowingAttemptResponse assess(UUID userId, UUID sentenceId, byte[] wav);

    /** Lượt mới nhất của từng câu đã đọc trong bài (UC-SHADOW-03). */
    List<LatestAttemptResponse> latestByLesson(UUID userId, UUID lessonId);

    /** Mọi lượt đọc của một câu, mới nhất trước, chưa kèm từng từ (UC-SHADOW-10). */
    List<ShadowingHistoryItem> history(UUID userId, UUID sentenceId);

    /** Kết quả đầy đủ của một lượt cũ; 404 nếu lượt không tồn tại hoặc không thuộc người học (UC-SHADOW-10). */
    LatestAttemptResponse attempt(UUID userId, long attemptId);
}
