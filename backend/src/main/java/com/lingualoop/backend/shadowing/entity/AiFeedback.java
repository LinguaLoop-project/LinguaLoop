package com.lingualoop.backend.shadowing.entity;

import java.time.Instant;

import org.springframework.data.domain.Persistable;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PostLoad;
import jakarta.persistence.PostPersist;
import jakarta.persistence.Table;
import jakarta.persistence.Transient;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Nhận xét AI cho một Lượt shadowing (mỗi lượt tối đa một nhận xét, khoá chính là mã lượt). Là {@link Persistable}
 * để lưu bản mới luôn là INSERT: hai yêu cầu cùng lượt đồng thời thì yêu cầu sau vi phạm khoá chính thay vì âm thầm
 * ghi đè, để service biết mà không trừ credit lần hai.
 */
@Getter
@Entity
@Table(name = "ai_feedback")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiFeedback implements Persistable<Long> {

    @Id
    @Column(name = "attempt_id")
    private Long attemptId;

    @Column(name = "content", nullable = false, updatable = false)
    private String content;

    /** Cột có mặc định {@code now()} ở DB nên không ghi từ ứng dụng. */
    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    @Transient
    private boolean isNew = true;

    public static AiFeedback of(long attemptId, String content) {
        AiFeedback feedback = new AiFeedback();
        feedback.attemptId = attemptId;
        feedback.content = content;
        return feedback;
    }

    @Override
    public Long getId() {
        return attemptId;
    }

    @Override
    public boolean isNew() {
        return isNew;
    }

    @PostLoad
    @PostPersist
    void markNotNew() {
        isNew = false;
    }
}
