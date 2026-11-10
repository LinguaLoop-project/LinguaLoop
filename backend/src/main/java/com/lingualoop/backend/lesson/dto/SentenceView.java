package com.lingualoop.backend.lesson.dto;

import java.util.UUID;

/** {@code sortOrder} là vị trí của câu trong bài (từ 1), tính theo thứ tự {@code startMs}. */
public record SentenceView(
    UUID id,
    UUID lessonId,
    int sortOrder,
    String text,
    String textVi,
    String ipaUs,
    String ipaUk,
    int startMs,
    int endMs
) {}
