package com.lingualoop.backend.lesson.dto.response;

import java.util.UUID;

/** Bài gợi ý cho người học chưa luyện nghe chép bài này: dẫn thẳng vào trang nghe chép của bài. */
public record LessonSuggestionResponse(UUID id, String title, String cefrLevel, int sentenceCount) {
}
