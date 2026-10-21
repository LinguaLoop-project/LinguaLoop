package com.lingualoop.backend.practice.dto.request;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.practice.enums.DictationLevel;

public record DictationAttemptRequest(UUID userId, UUID sentenceId, DictationLevel level, BigDecimal playbackRate,
        int replayCount, Integer durationMs, boolean retry, boolean gaveUp, String submittedText,
        BigDecimal score, List<AttemptWordRequest> words) {

    public DictationAttemptRequest {
        words = List.copyOf(words);
    }
}
