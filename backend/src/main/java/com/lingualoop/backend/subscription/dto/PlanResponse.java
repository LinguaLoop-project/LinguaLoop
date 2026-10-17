package com.lingualoop.backend.subscription.dto;

/** Gói hiện tại của người dùng: {@code free} hoặc {@code pro}. */
public record PlanResponse(String plan) {

    public static PlanResponse of(boolean pro) {
        return new PlanResponse(pro ? "pro" : "free");
    }
}
