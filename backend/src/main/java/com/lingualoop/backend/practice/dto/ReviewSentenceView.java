package com.lingualoop.backend.practice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.practice.enums.DictationLevel;
import com.lingualoop.backend.practice.enums.ReviewReason;

/** Một câu trong danh sách Câu cần ôn kèm điểm và mức của lượt làm gần nhất. */
public record ReviewSentenceView(UUID sentenceId, ReviewReason reason, Instant addedAt, String lessonSlug,
        String lessonTitle, int sortOrder, String text, String textVi, BigDecimal lastScore, DictationLevel lastLevel,
        Instant lastAttemptedAt) {
}
