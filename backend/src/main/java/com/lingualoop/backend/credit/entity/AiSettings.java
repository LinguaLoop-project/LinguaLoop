package com.lingualoop.backend.credit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Cấu hình credit AI toàn hệ thống (đúng một dòng, id = 1). */
@Getter
@Entity
@Table(name = "ai_settings")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiSettings {

    public static final short ID = 1;

    @Id
    private Short id;

    @Column(name = "credit_value_vnd", nullable = false)
    private int creditValueVnd;

    @Column(name = "free_daily_credits", nullable = false)
    private int freeDailyCredits;

    @Column(name = "min_balance_to_start", nullable = false)
    private int minBalanceToStart;
}
