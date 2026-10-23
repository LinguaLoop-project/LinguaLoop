package com.lingualoop.backend.dictation.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.dictation.dto.request.RevealWordRequest;
import com.lingualoop.backend.dictation.dto.request.SubmitAttemptRequest;
import com.lingualoop.backend.dictation.dto.response.AttemptResultResponse;
import com.lingualoop.backend.dictation.dto.response.DictationLessonResponse;
import com.lingualoop.backend.dictation.dto.response.DictationLessonResponse.LatestResult;
import com.lingualoop.backend.dictation.dto.response.PromptResponse;
import com.lingualoop.backend.dictation.dto.response.RevealWordResponse;
import com.lingualoop.backend.practice.enums.DictationLevel;

public interface DictationService {

    DictationLessonResponse getLesson(UUID userId, String slug);

    /** Đề của một câu ở mức đã chọn; Easy chọn ô trống mới ở mỗi lần gọi. */
    PromptResponse getPrompt(UUID userId, UUID sentenceId, DictationLevel level);

    /** Kết quả từng từ của lượt gần nhất của câu, để mở lại câu đã làm; 404 nếu chưa làm câu này. */
    AttemptResultResponse getLatestAttempt(UUID userId, UUID sentenceId);

    /** Mọi lượt làm của câu, mới nhất trước, kể cả lượt làm lại và bỏ cuộc; rỗng nếu chưa làm câu này. */
    List<LatestResult> getAttemptHistory(UUID userId, UUID sentenceId);

    /** Kết quả từng từ của một lượt trong lịch sử; 404 nếu lượt không tồn tại hoặc không thuộc người dùng và câu này. */
    AttemptResultResponse getAttempt(UUID userId, UUID sentenceId, long attemptId);

    /** Lộ một từ của câu để làm gợi ý. Không lưu gì: từ đã lộ chỉ được tính khi nộp qua revealedPositions. */
    RevealWordResponse revealWord(UUID userId, UUID sentenceId, RevealWordRequest request);

    /** Chấm, lưu lượt làm và ghi nhận hoạt động học của bài. */
    AttemptResultResponse submitAttempt(UUID userId, UUID sentenceId, SubmitAttemptRequest request);
}
