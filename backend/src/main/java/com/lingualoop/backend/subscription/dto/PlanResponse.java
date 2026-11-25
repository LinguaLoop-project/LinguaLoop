package com.lingualoop.backend.subscription.dto;

import java.time.Instant;

/**
 * Gói hiện tại của người dùng (UC-PR-01): {@code free} hoặc {@code pro}. Với Pro, {@code startsAt} và {@code endsAt} là
 * khoảng Pro liên tục hiện tại, gồm cả các kỳ gia hạn nối tiếp (BR-PR-04, BR-PR-07).
 */
public record PlanResponse(String plan, Instant startsAt, Instant endsAt) {

    public static PlanResponse of(boolean pro) {
        return new PlanResponse(pro ? "pro" : "free", null, null);
    }

    public static PlanResponse pro(Instant startsAt, Instant endsAt) {
        return new PlanResponse("pro", startsAt, endsAt);
    }
}
