package com.lingualoop.backend.lesson.dto.response;

import java.util.UUID;

public record LessonSummaryResponse(
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
    ModeProgressResponse progress
) {}
