package com.lingualoop.backend.practice.dto;

import java.time.Instant;
import java.util.UUID;

/** Ghi chú kèm câu và bài chứa nó, cho trang liệt kê ghi chú. Câu đã có lượt làm nên được hiện chữ gốc. */
public record SentenceNoteEntryView(UUID sentenceId, String content, Instant updatedAt, String lessonSlug,
        String lessonTitle, int sortOrder, String text, String textVi) {
}
