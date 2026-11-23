package com.lingualoop.backend.credit.entity;

import java.math.BigDecimal;
import java.time.Instant;
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

/**
 * Một lần dùng tính năng tính credit: thành công, lỗi, bị từ chối vì hết credit, hoặc chi phí phát sinh thêm trong một
 * lần dùng đã trừ (BR-GA-12, BR-NK-09).
 */
@Getter
@Entity
@Table(name = "ai_usage_logs")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiUsageLog {

    public static final String SUCCESS = "success";
    public static final String FAILED = "failed";
    public static final String REJECTED_NO_CREDIT = "rejected_no_credit";
    /** Chi phí thêm của một lần dùng đã trừ credit: không trừ credit, không tính là một lần dùng. */
    public static final String EXTRA_COST = "extra_cost";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, updatable = false)
    private UUID userId;

    @Column(name = "feature", nullable = false, updatable = false)
    private String feature;

    @Column(name = "status", nullable = false, updatable = false)
    private String status;

    @Column(name = "quantity", nullable = false, updatable = false)
    private int quantity;

    // Ba cột số đơn vị và chi phí được điền một lần cho dòng của phiên giọng nói (fillLiveCost); các dòng khác không đổi
    @Column(name = "input_units", nullable = false)
    private int inputUnits;

    @Column(name = "output_units", nullable = false)
    private int outputUnits;

    @Column(name = "credits_charged", nullable = false, updatable = false)
    private int creditsCharged;

    @Column(name = "cost_vnd", nullable = false)
    private BigDecimal costVnd;

    @Column(name = "model", updatable = false)
    private String model;

    @Column(name = "cost_estimated", nullable = false, updatable = false)
    private boolean costEstimated;

    /** Phiên giọng nói của dòng này; null với các tính năng khác. */
    @Column(name = "session_id", updatable = false)
    private UUID sessionId;

    @Column(name = "created_at", insertable = false, updatable = false)
    private Instant createdAt;

    /** Dòng không có khối lượng xử lý (lỗi, bị từ chối): chi phí 0. */
    public static AiUsageLog of(UUID userId, String feature, String status) {
        return of(userId, feature, status, 1, 0, 0, 0, BigDecimal.ZERO, null, false);
    }

    @SuppressWarnings("java:S107") // khớp đủ cột của bảng, chỉ CreditServiceImpl gọi
    public static AiUsageLog of(UUID userId, String feature, String status, int quantity, int inputUnits,
            int outputUnits, int creditsCharged, BigDecimal costVnd, String model, boolean costEstimated) {
        AiUsageLog log = new AiUsageLog();
        log.userId = userId;
        log.feature = feature;
        log.status = status;
        log.quantity = quantity;
        log.inputUnits = inputUnits;
        log.outputUnits = outputUnits;
        log.creditsCharged = creditsCharged;
        log.costVnd = costVnd;
        log.model = model;
        log.costEstimated = costEstimated;
        return log;
    }

    /** Gắn dòng vào phiên giọng nói để điền chi phí khi phiên đóng. */
    public AiUsageLog forSession(UUID sessionId) {
        this.sessionId = sessionId;
        return this;
    }

    /** Dòng của phiên giọng nói chưa được điền chi phí. */
    public boolean liveCostPending() {
        return sessionId != null && costEstimated && inputUnits == 0 && outputUnits == 0;
    }

    /** Điền số đơn vị xử lý và chi phí của phiên giọng nói (BR-GA-12); chỉ một lần. */
    public void fillLiveCost(int inputUnits, int outputUnits, BigDecimal costVnd) {
        if (!liveCostPending()) {
            throw new IllegalStateException("Dòng không phải phiên giọng nói chờ chi phí");
        }
        this.inputUnits = inputUnits;
        this.outputUnits = outputUnits;
        this.costVnd = costVnd;
    }
}
