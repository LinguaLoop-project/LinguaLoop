package com.lingualoop.backend.lesson.dto;

import java.util.List;

public record TopicRow(
    TopicResponse topic,
    Long totalLessons,
    List<LessonSummary> lessons
) {}
