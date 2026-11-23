package com.lingualoop.backend.practice.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Từng lượt của một Buổi luyện, từ mới đến cũ (BR-TH-06). */
public record PracticeSessionDetailView(UUID lessonId, String lessonTitle, boolean available, List<Attempt> attempts) {

    public PracticeSessionDetailView {
        attempts = List.copyOf(attempts);
    }

    /** {@code kind} là {@code normal}, {@code retry} hoặc {@code gave_up}. */
    public record Attempt(long attemptId, UUID sentenceId, String text, Instant at, BigDecimal score, String kind) {
    }
}
