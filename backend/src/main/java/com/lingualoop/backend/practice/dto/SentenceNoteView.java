package com.lingualoop.backend.practice.dto;

import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;

/** Ghi chú của người dùng cho một câu ở một chế độ. */
public record SentenceNoteView(UUID sentenceId, PracticeMode mode, String content, Instant updatedAt) {
}
