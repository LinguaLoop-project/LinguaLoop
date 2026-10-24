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

/**
 * Chỗ của một câu trong danh sách Câu cần ôn ở một chế độ. Chỉ lưu trạng thái hàng đợi; ghi qua các truy vấn
 * của repository vì cần upsert nguyên tử.
 */
@Entity
@Table(name = "user_sentence_review")
@IdClass(SentenceReviewId.class)
@Getter
public class SentenceReview {

    @Id
    @Column(name = "user_id")
    private UUID userId;

    @Id
    @Column(name = "sentence_id")
    private UUID sentenceId;

    @Id
    @Enumerated(EnumType.STRING)
    @Column(name = "mode", columnDefinition = "practice_mode")
    private PracticeMode mode;

    @Column(name = "status", nullable = false)
    private String status;

    @Column(name = "reason", nullable = false)
    private String reason;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "last_reviewed_at")
    private Instant lastReviewedAt;
}
