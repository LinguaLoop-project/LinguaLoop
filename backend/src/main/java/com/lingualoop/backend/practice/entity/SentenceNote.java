package com.lingualoop.backend.practice.entity;

import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;

/** Ghi chú riêng của một người dùng cho một câu; mỗi cặp (người dùng, câu) có tối đa một ghi chú. */
@Entity
@Table(name = "sentence_notes")
@Getter
@Setter
public class SentenceNote {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "sentence_id", nullable = false, updatable = false)
    private UUID sentenceId;

    @Column(name = "content", nullable = false)
    private String content;

    /** Cột có mặc định {@code now()} ở DB nên không ghi từ ứng dụng. */
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}
