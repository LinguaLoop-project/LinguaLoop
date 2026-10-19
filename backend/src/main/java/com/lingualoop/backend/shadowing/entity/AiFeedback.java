package com.lingualoop.backend.shadowing.entity;

import java.time.Instant;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Nhận xét AI cho một Lượt shadowing (mỗi lượt tối đa một nhận xét). */
@Getter
@Entity
@Table(name = "ai_feedback")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiFeedback {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "attempt_id", nullable = false, updatable = false)
    private Long attemptId;

    @Column(name = "content", nullable = false, updatable = false)
    private String content;

    @Column(name = "model", nullable = false, updatable = false)
    private String model;

    @Column(name = "prompt_version", nullable = false, updatable = false)
    private String promptVersion;

    @Column(name = "input_tokens", updatable = false)
    private Integer inputTokens;

    @Column(name = "output_tokens", updatable = false)
    private Integer outputTokens;

    /** Cột có mặc định {@code now()} ở DB nên không ghi từ ứng dụng. */
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    public static AiFeedback of(long attemptId, String content, String model, String promptVersion,
            Integer inputTokens, Integer outputTokens) {
        AiFeedback feedback = new AiFeedback();
        feedback.attemptId = attemptId;
        feedback.content = content;
        feedback.model = model;
        feedback.promptVersion = promptVersion;
        feedback.inputTokens = inputTokens;
        feedback.outputTokens = outputTokens;
        return feedback;
    }
}
