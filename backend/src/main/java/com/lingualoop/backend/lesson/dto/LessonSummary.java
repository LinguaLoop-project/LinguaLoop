package com.lingualoop.backend.lesson.dto;

import java.util.UUID;

public record LessonSummary(
    UUID id,
    String slug,
    String title,
    String titleVi,
    String difficulty,
    String sourceType,
    Integer durationSec,
    Integer viewCount,
    String thumbnailUrl,
    boolean pro,
    boolean locked,
    Long sentenceCount,
    ModeProgress progress
) {}
