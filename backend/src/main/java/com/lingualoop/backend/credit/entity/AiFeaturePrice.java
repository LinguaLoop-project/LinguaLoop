package com.lingualoop.backend.credit.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Đơn giá một tính năng AI: đồng cho mỗi một triệu đơn vị xử lý vào và ra. */
@Getter
@Entity
@Table(name = "ai_feature_prices")
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class AiFeaturePrice {

    @Id
    @Column(name = "feature")
    private String feature;

    @Column(name = "input_price_vnd", nullable = false)
    private long inputPriceVnd;

    @Column(name = "output_price_vnd", nullable = false)
    private long outputPriceVnd;
}
