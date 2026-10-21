package com.lingualoop.backend.subscription.entity;

import java.io.Serializable;

import org.hibernate.annotations.Immutable;

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

/** Hạn mức của một gói cho một tính năng; {@code limitValue} null nghĩa là không giới hạn. */
@Getter
@Entity
@Immutable
@Table(name = "plan_limits")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PlanLimit {

    @EmbeddedId
    private Key id;

    @Column(name = "period", nullable = false)
    private String period;

    @Column(name = "limit_value")
    private Integer limitValue;

    @Embeddable
    @Getter
    @EqualsAndHashCode
    @NoArgsConstructor(access = AccessLevel.PROTECTED)
    @AllArgsConstructor
    public static class Key implements Serializable {

        private static final long serialVersionUID = 1L;

        @Column(name = "plan", nullable = false)
        private String plan;

        @Column(name = "feature", nullable = false, columnDefinition = "feature_code")
        private String feature;
    }
}
