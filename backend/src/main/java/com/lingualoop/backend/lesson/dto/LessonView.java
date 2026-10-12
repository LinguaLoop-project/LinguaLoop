package com.lingualoop.backend.lesson.dto;

import java.util.UUID;

public record LessonView(
    UUID id,
    String slug,
    String title,
    String titleVi,
    String difficulty,
    boolean pro,
    String sourceType,
    String sourceUrl,
    Integer durationSec
) {}
