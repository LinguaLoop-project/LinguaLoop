package com.lingualoop.backend.dictation.dto.response;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.practice.enums.DictationLevel;

public record DictationLessonResponse(UUID id, String slug, String title, String titleVi, String difficulty,
        boolean pro, String sourceType, String sourceUrl, Integer durationSec, List<SentenceItem> sentences) {

    public DictationLessonResponse {
        sentences = List.copyOf(sentences);
    }

    /** {@code text} và {@code textVi} chỉ có khi câu đã có kết quả. */
    public record SentenceItem(UUID id, int sortOrder, int startMs, int endMs, int wordCount, String text,
            String textVi, LatestResult latest) {
    }

    public record LatestResult(long attemptId, DictationLevel level, BigDecimal score, boolean gaveUp,
            boolean retry, Instant attemptedAt) {
    }
}
