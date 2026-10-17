package com.lingualoop.backend.subscription.dto;

import java.time.LocalDate;

/** Phiếu một lượt đã giữ chỗ; cần giữ để trả lại đúng chu kỳ nếu việc phía sau thất bại. */
public record UsageTicket(String feature, LocalDate periodStart) {
}
