package com.lingualoop.backend.lesson.dto;

import java.util.List;

public record LibraryOverview(
    List<LessonSummary> continueLessons,
    List<TopicRow> topicRows
) {}
