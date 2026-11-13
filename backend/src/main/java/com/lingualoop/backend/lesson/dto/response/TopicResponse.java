package com.lingualoop.backend.lesson.dto.response;

import java.util.UUID;

public record TopicResponse(
    UUID id,
    String name,
    Long totalLessons,
    Long completedLessons
) {}
