package com.lingualoop.backend.dictation.service;

import java.util.UUID;

import com.lingualoop.backend.dictation.dto.request.SubmitAttemptRequest;
import com.lingualoop.backend.dictation.dto.response.AttemptResultResponse;
import com.lingualoop.backend.dictation.dto.response.DictationLessonResponse;
import com.lingualoop.backend.dictation.dto.response.PromptResponse;
import com.lingualoop.backend.practice.enums.DictationLevel;

public interface DictationService {

    DictationLessonResponse getLesson(UUID userId, String slug);

    /** Đề của một câu ở mức đã chọn; Easy chọn ô trống mới ở mỗi lần gọi. */
    PromptResponse getPrompt(UUID userId, UUID sentenceId, DictationLevel level);

    /** Chấm, lưu lượt làm và ghi nhận hoạt động học của bài. */
    AttemptResultResponse submitAttempt(UUID userId, UUID sentenceId, SubmitAttemptRequest request);
}
