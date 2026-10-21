package com.lingualoop.backend.practice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.practice.enums.DictationLevel;

/** Một lượt nghe chép đã lưu kèm kết quả từng từ, các từ xếp theo vị trí. */
public record DictationAttemptDetailView(long attemptId, UUID sentenceId, DictationLevel level, BigDecimal score,
        boolean retry, boolean gaveUp, Instant attemptedAt, List<AttemptWordView> words) {

    public DictationAttemptDetailView {
        words = List.copyOf(words);
    }
}
