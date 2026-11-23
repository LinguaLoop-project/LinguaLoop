package com.lingualoop.backend.credit.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Cấu hình credit mới (UC-GA-02), gửi đủ mọi giá trị. Khoảng hợp lệ theo BR-GA-02, BR-GA-03, BR-GA-04; tổng phí cổng
 * và biên tối thiểu nhỏ hơn 100% kiểm ở service (5b).
 */
public record UpdateCreditConfigRequest(
        @NotNull Instant version,
        @NotNull @Min(1) @Max(1000) Integer creditValueVnd,
        @NotNull @DecimalMin("0") @DecimalMax("99") @Digits(integer = 2, fraction = 1) BigDecimal gatewayFeePct,
        @NotNull @DecimalMin("0") @DecimalMax("99") @Digits(integer = 2, fraction = 1) BigDecimal marginPct,
        @NotNull @Min(0) @Max(10000) Integer trialCredits,
        @NotNull @Size(min = 5, max = 5) List<@Valid @NotNull FeaturePrice> features) {

    public record FeaturePrice(
            @NotBlank String feature,
            @NotNull @Min(1) @Max(1000) Integer creditsPerUse,
            @NotNull @Min(0) @Max(100_000_000) Long inputPriceVnd,
            @NotNull @Min(0) @Max(100_000_000) Long outputPriceVnd,
            @NotNull @Min(0) @Max(100_000_000) Integer fixedCostVnd) {
    }
}
