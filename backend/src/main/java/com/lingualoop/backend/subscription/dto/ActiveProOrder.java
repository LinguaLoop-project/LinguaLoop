package com.lingualoop.backend.subscription.dto;

import java.time.Instant;

/** Đơn Pro đang hiệu lực của một người dùng, đủ để feature credit nạp ví theo tháng. */
public record ActiveProOrder(int creditsPerMonth, Instant startsAt, Instant endsAt) {
}
