package com.lingualoop.backend.subscription.dto.request;

import jakarta.validation.constraints.NotNull;

/** Bật bán ({@code true}) hoặc ngừng bán ({@code false}) một gói Pro (UC-GA-06). */
public record SetOnSaleRequest(@NotNull Boolean onSale) {
}
