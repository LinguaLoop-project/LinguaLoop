package com.lingualoop.backend.subscription.dto.request;

import java.time.Instant;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Thêm hoặc sửa gói Pro (UC-GA-04, UC-GA-05), khoảng hợp lệ theo BR-GA-07. {@code version} bắt buộc khi sửa, bỏ trống
 * khi thêm.
 */
public record ProPlanRequest(
        Instant version,
        @NotBlank @Size(max = 50) String name,
        @NotNull @Min(1) @Max(36) Integer months,
        @NotNull @Min(0) @Max(100_000_000) Integer priceVnd,
        @NotNull @Min(0) @Max(1_000_000) Integer creditsPerMonth) {
}
