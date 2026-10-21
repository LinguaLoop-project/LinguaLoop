package com.lingualoop.backend.lesson.dto.response;

/** Tiến độ của người học trên một bài: phần trăm câu đã luyện theo chế độ và tổng thời gian học (giây). */
public record ModeProgressResponse(
    Integer dictationPercent,
    Integer shadowingPercent,
    Integer studyTimeSec
) {}
