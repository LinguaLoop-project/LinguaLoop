package com.lingualoop.backend.lesson.dto;

import java.util.UUID;

public record TopicResponse(
    UUID id,
    String slug,
    String name,
    String nameVi,
    String icon,
    Integer sortOrder,
    Long totalLessons,
    Long completedLessons
) {}
