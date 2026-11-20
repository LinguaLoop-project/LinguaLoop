package com.lingualoop.backend.lesson.service;

import java.util.UUID;

import com.lingualoop.backend.lesson.dto.request.SuggestSentencesRequest;
import com.lingualoop.backend.lesson.dto.response.SentenceSuggestionResponse;

/** Tạo lại gợi ý bản dịch và IPA ở màn Sửa câu (UC-BH-10). */
public interface LessonSuggestionService {

    /**
     * Gợi ý cho các câu được gửi, không lưu gì vào bài (BR-BH-14). Bản dịch dịch theo từng lô; AI lỗi thì trả phần đã
     * có kèm {@code translationOutcome}, không ném lỗi. Chưa trừ credit (module credit làm sau). Bài không thuộc giáo viên ném {@code ForbiddenException}; bài đã xóa ném {@code LESSON_NOT_FOUND};
     * câu không thuộc bài ném {@code LESSON_SENTENCE_NOT_FOUND}; không chọn nội dung nào ném
     * {@code FieldValidationException}.
     */
    SentenceSuggestionResponse suggest(UUID teacherId, UUID lessonId, SuggestSentencesRequest request);
}
