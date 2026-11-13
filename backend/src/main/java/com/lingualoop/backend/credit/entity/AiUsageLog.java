package com.lingualoop.backend.credit.entity;

import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Một lần dùng AI: thành công, lỗi, hoặc bị từ chối vì hết credit. */
@Getter
@Entity
@Table(name = "ai_usage_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiUsageLog {

    public static final String SUCCESS = "success";
    public static final String FAILED = "failed";
    public static final String REJECTED_NO_CREDIT = "rejected_no_credit";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "feature", nullable = false, updatable = false)
    private String feature;

    @Column(name = "status", nullable = false, updatable = false)
    private String status;

    @Column(name = "input_units", nullable = false, updatable = false)
    private int inputUnits;

    @Column(name = "output_units", nullable = false, updatable = false)
    private int outputUnits;

    @Column(name = "credits_charged", nullable = false, updatable = false)
    private int creditsCharged;

    public static AiUsageLog of(UUID userId, String feature, String status, int inputUnits, int outputUnits,
            int creditsCharged) {
        AiUsageLog log = new AiUsageLog();
        log.userId = userId;
        log.feature = feature;
        log.status = status;
        log.inputUnits = inputUnits;
        log.outputUnits = outputUnits;
        log.creditsCharged = creditsCharged;
        return log;
    }
}
