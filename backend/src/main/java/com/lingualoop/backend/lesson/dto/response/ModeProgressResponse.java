package com.lingualoop.backend.lesson.dto.response;

/** Tiến độ của người học trên một bài: phần trăm câu đã có lượt làm, theo từng chế độ. */
public record ModeProgressResponse(
    Integer dictationPercent,
    Integer shadowingPercent
) {}
