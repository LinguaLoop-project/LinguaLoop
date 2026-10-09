package com.lingualoop.backend.lesson.dto;

import java.util.UUID;

public record SentenceView(
    UUID id,
    UUID lessonId,
    int sortOrder,
    String text,
    String textVi,
    String ipa,
    int startMs,
    int endMs,
    String cefrLevel
) {}
