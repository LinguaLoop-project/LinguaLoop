package com.lingualoop.backend.lesson.dto.response;

import java.util.UUID;

public record SentenceResponse(
    UUID id,
    String text,
    String textVi,
    String ipa,
    Integer startMs,
    Integer endMs,
    String cefrLevel,
    Integer myBestScore
) {}
