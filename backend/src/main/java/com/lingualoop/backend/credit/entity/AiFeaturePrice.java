package com.lingualoop.backend.credit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * Một tính năng tính credit (BR-GA-04): credit trừ mỗi đơn vị, cùng đơn giá đầu vào, đầu ra (đồng cho mỗi một triệu
 * đơn vị xử lý) và chi phí cố định mỗi lần (đồng) dùng để tính chi phí thật.
 */
@Getter
@Entity
@Table(name = "ai_feature_prices")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiFeaturePrice {

    @Id
    @Column(name = "feature")
    private String feature;

    @Column(name = "credits_per_use", nullable = false)
    private int creditsPerUse;

    @Column(name = "input_price_vnd", nullable = false)
    private long inputPriceVnd;

    @Column(name = "output_price_vnd", nullable = false)
    private long outputPriceVnd;

    @Column(name = "fixed_cost_vnd", nullable = false)
    private int fixedCostVnd;

    public void update(int creditsPerUse, long inputPriceVnd, long outputPriceVnd, int fixedCostVnd) {
        this.creditsPerUse = creditsPerUse;
        this.inputPriceVnd = inputPriceVnd;
        this.outputPriceVnd = outputPriceVnd;
        this.fixedCostVnd = fixedCostVnd;
    }
}
