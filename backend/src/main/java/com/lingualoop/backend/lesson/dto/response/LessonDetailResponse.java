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
    List<LessonSummaryResponse> relatedLessons,
    /** Học viên đã lưu bài này vào Bài đã lưu (UC-TC-05). */
    boolean saved
) {}
