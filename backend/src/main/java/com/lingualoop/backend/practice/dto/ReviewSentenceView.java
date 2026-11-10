package com.lingualoop.backend.practice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.enums.DictationLevel;
import com.lingualoop.backend.practice.enums.ReviewReason;

/** Một câu trong danh sách Câu cần ôn của một chế độ, kèm điểm của lượt gần nhất (mức chỉ có ở nghe chép). */
public record ReviewSentenceView(UUID sentenceId, PracticeMode mode, ReviewReason reason, Instant addedAt, UUID lessonId,
        String lessonTitle, int sortOrder, String text, String textVi, BigDecimal lastScore, DictationLevel lastLevel,
        Instant lastAttemptedAt) {
}
