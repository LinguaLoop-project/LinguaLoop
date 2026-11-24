package com.lingualoop.backend.subscription.dto;

import java.util.UUID;

/** Một gói Pro đang bán, cho học viên chọn khi nâng cấp hoặc gia hạn (BR-PR-11). */
public record SalePlanView(UUID id, String name, int months, int priceVnd, int creditsPerMonth) {
}
