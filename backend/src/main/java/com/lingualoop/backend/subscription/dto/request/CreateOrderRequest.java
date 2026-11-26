package com.lingualoop.backend.subscription.dto.request;

import java.util.UUID;

import com.lingualoop.backend.subscription.enums.OrderKind;

import jakarta.validation.constraints.NotNull;

/** Tạo đơn nâng cấp (UC-PR-02) hoặc gia hạn (UC-PR-04) cho một gói đang bán. */
public record CreateOrderRequest(@NotNull UUID planId, @NotNull OrderKind kind) {
}
