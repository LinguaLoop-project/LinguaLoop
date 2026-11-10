package com.lingualoop.backend.practice.entity;

import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.IdClass;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Ghi chú riêng của một người dùng cho một câu ở một chế độ; khoá chính là bộ (người dùng, câu, chế độ). */
@Entity
@Table(name = "sentence_notes")
@IdClass(SentenceNoteId.class)
@Getter
@Setter
public class SentenceNote {

    @Id
    @Column(name = "user_id", updatable = false)
    private UUID userId;

    @Id
    @Column(name = "sentence_id", updatable = false)
    private UUID sentenceId;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "mode", updatable = false)
    private PracticeMode mode;

    @Column(name = "content", nullable = false)
    private String content;

    /** Cột có mặc định {@code now()} ở DB nên không ghi từ ứng dụng. */
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
