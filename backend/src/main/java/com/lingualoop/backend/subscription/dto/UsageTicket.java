package com.lingualoop.backend.subscription.dto;

import java.time.LocalDate;

/** Phiếu một lượt/năng lượng đã giữ chỗ; cần giữ để trả lại đúng chu kỳ nếu việc phía sau thất bại. */
public record UsageTicket(String feature, LocalDate periodStart, int cost) {

    public UsageTicket(String feature, LocalDate periodStart) {
        this(feature, periodStart, 1);
    }
}
