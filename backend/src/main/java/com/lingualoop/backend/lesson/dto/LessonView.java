package com.lingualoop.backend.lesson.dto;

import java.util.UUID;

public record LessonView(
    UUID id,
    String title,
    String cefrLevel,
    boolean pro,
    String youtubeId,
    Integer durationSec
) {}
