package com.lingualoop.backend.shadowing.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/** Điểm Shadowing trung bình của một ngày hoặc một tuần (tuần bắt đầu từ thứ Hai); {@code from} là ngày đầu của mốc. */
public record ScorePointView(LocalDate from, BigDecimal averageScore, long attempts) {
}
