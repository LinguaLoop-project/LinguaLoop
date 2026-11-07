package com.lingualoop.backend.practice.dto;

import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;

/** Ghi chú kèm câu và bài chứa nó, cho trang liệt kê ghi chú. Câu đã có lượt ở chế độ của ghi chú nên được hiện chữ gốc. */
public record SentenceNoteEntryView(UUID sentenceId, PracticeMode mode, String content, Instant updatedAt,
        String lessonSlug, String lessonTitle, int sortOrder, String text, String textVi) {
}
