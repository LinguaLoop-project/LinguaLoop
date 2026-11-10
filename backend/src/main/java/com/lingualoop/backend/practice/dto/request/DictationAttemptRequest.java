package com.lingualoop.backend.practice.dto.request;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.practice.enums.DictationLevel;

public record DictationAttemptRequest(UUID userId, UUID sentenceId, DictationLevel level, BigDecimal playbackRate,
        int replayCount, Integer durationMs, boolean retry, boolean gaveUp, String submittedText,
        BigDecimal score, List<AttemptWordRequest> words, UUID clientRequestId) {

    public DictationAttemptRequest {
        words = List.copyOf(words);
    }

    /** Không có {@code clientRequestId}: lượt không được chống trùng khi gửi lại. {@code playbackRate}, {@code durationMs} không còn lưu. */
    public DictationAttemptRequest(UUID userId, UUID sentenceId, DictationLevel level, BigDecimal playbackRate,
            int replayCount, Integer durationMs, boolean retry, boolean gaveUp, String submittedText,
            BigDecimal score, List<AttemptWordRequest> words) {
        this(userId, sentenceId, level, playbackRate, replayCount, durationMs, retry, gaveUp, submittedText, score,
                words, null);
    }
}
