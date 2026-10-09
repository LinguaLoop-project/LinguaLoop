package com.lingualoop.backend.lesson.dto;

import java.util.List;
import java.util.UUID;

public record LessonDetail(
    UUID id,
    String slug,
    String title,
    String titleVi,
    String description,
    String difficulty,
    String sourceType,
    String sourceUrl,
    Integer durationSec,
    Integer viewCount,
    String thumbnailUrl,
    boolean pro,
    boolean locked,
    Long sentenceCount,
    ModeProgress progress,
    List<LessonSummary> relatedLessons
) {}
