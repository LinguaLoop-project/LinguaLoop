package com.lingualoop.backend.lesson.dto.response;

import java.util.List;

public record LibraryOverviewResponse(
    List<LessonSummaryResponse> continueLessons,
    List<TopicRowResponse> topicRows
) {}
