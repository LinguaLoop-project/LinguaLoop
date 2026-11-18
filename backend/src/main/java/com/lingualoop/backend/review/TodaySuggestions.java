package com.lingualoop.backend.review;

import com.lingualoop.backend.lesson.dto.response.LessonSuggestionResponse;
import com.lingualoop.backend.vocab.dto.NewWordsSuggestion;

/**
 * Việc gợi ý cho trang Hôm nay khi học viên không còn thẻ hay câu nào để ôn: phần từ mới kế tiếp, một bài nghe chép chưa
 * làm và một bài Shadowing chưa làm (ưu tiên bài đã nghe chép xong). Mỗi phần có thể trống (đã học hết từ mới, đã luyện
 * hết bài).
 */
public record TodaySuggestions(NewWordsSuggestion newWords, LessonSuggestionResponse dictationLesson,
        LessonSuggestionResponse shadowingLesson) {
}
