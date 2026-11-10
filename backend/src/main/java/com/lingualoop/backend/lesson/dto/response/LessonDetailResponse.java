package com.lingualoop.backend.lesson.dto.response;

import java.util.List;
import java.util.UUID;

public record LessonDetailResponse(
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
    ModeProgressResponse progress,
    TopicResponse topic,
    List<LessonSummaryResponse> relatedLessons
) {}
