package com.lingualoop.backend.lesson.dto.response;

import java.util.UUID;

public record LessonSummaryResponse(
    UUID id,
    String title,
    String cefrLevel,
    String youtubeId,
    Integer durationSec,
    Integer viewCount,
    String thumbnailUrl,
    boolean pro,
    boolean locked,
    Long sentenceCount,
    ModeProgressResponse progress
) {}
