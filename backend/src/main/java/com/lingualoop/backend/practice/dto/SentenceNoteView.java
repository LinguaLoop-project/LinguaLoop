package com.lingualoop.backend.practice.dto;

import java.time.Instant;
import java.util.UUID;

/** Ghi chú của người dùng cho một câu. */
public record SentenceNoteView(UUID sentenceId, String content, Instant updatedAt) {
}
