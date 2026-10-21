package com.lingualoop.backend.subscription.dto;

/**
 * Mức dùng của một tính năng trong chu kỳ hiện tại. {@code limit} và {@code remaining} rỗng
 * khi gói không giới hạn tính năng đó.
 */
public record FeatureUsage(String feature, String period, Integer limit, int used, Integer remaining) {

    public static FeatureUsage of(String feature, String period, Integer limit, int used) {
        return new FeatureUsage(feature, period, limit, used, limit == null ? null : Math.max(limit - used, 0));
    }
}
