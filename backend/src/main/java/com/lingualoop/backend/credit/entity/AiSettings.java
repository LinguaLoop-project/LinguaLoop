package com.lingualoop.backend.credit.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.Generated;
import org.hibernate.generator.EventType;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Cấu hình credit AI toàn hệ thống (đúng một dòng, id = 1, BR-GA-02, BR-GA-03). */
@Getter
@Entity
@Table(name = "ai_settings")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiSettings {

    /** Khoá chính của dòng cấu hình duy nhất. */
    public static final short SINGLETON_ID = 1;

    @Id
    private Short id;

    @Column(name = "credit_value_vnd", nullable = false)
    private int creditValueVnd;

    @Column(name = "gateway_fee_pct", nullable = false)
    private BigDecimal gatewayFeePct;

    @Column(name = "margin_pct", nullable = false)
    private BigDecimal marginPct;

    /** Credit dùng thử tặng một lần cho mỗi học viên mới (BR-GA-03). */
    @Column(name = "trial_credits", nullable = false)
    private int trialCredits;

    /** null = chưa từng được quản trị viên sửa (UC-GA-01 5a). */
    @Column(name = "updated_by")
    private UUID updatedBy;

    /**
     * Mốc sửa gần nhất, cũng là phiên bản để phát hiện hai quản trị viên sửa cùng lúc (UC-GA-02 8b). Trigger
     * {@code set_updated_at} của DB đặt giá trị; Hibernate đọc lại sau mỗi lần sửa.
     */
    @Generated(event = {EventType.INSERT, EventType.UPDATE})
    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    public void update(int creditValueVnd, BigDecimal gatewayFeePct, BigDecimal marginPct, int trialCredits,
            UUID adminId) {
        this.creditValueVnd = creditValueVnd;
        this.gatewayFeePct = gatewayFeePct;
        this.marginPct = marginPct;
        this.trialCredits = trialCredits;
        this.updatedBy = adminId;
    }
}
