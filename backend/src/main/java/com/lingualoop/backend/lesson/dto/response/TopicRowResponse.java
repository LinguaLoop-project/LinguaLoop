package com.lingualoop.backend.lesson.dto.response;

import java.util.List;

public record TopicRowResponse(
    TopicResponse topic,
    Long totalLessons,
    List<LessonSummaryResponse> lessons
) {}
