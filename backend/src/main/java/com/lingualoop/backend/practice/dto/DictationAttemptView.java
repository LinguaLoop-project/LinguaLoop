package com.lingualoop.backend.practice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.practice.enums.DictationLevel;

/** Kết quả gần nhất của một câu trong bài, mọi mức, kể cả lượt làm lại hoặc bỏ cuộc. */
public record DictationAttemptView(long attemptId, UUID sentenceId, DictationLevel level, BigDecimal score,
        boolean retry, boolean gaveUp, Instant attemptedAt) {
}
