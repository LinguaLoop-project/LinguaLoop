package com.lingualoop.backend.subscription.entity;

import java.io.Serializable;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Số lượt đã dùng của một người dùng cho một tính năng trong một chu kỳ. Chỉ đọc qua entity; việc tăng và hoàn lượt
 * đi qua câu lệnh UPDATE có điều kiện trong repository để hai yêu cầu đồng thời không vượt hạn mức.
 */
@Getter
@Entity
@Table(name = "usage_counters")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class UsageCounter {

    @EmbeddedId
    private Key id;

    @Column(name = "used", nullable = false)
    private int used;

    @Embeddable
    @Getter
    @EqualsAndHashCode
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    public static class Key implements Serializable {

        private static final long serialVersionUID = 1L;

        @Column(name = "user_id", nullable = false)
        private UUID userId;

        @Column(name = "feature", nullable = false, columnDefinition = "feature_code")
        private String feature;

        @Column(name = "period_start", nullable = false)
        private LocalDate periodStart;
    }
}
