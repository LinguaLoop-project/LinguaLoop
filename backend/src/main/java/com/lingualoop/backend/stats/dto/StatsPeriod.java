package com.lingualoop.backend.stats.dto;

/** Khoảng thời gian xem thống kê: 7, 30 hoặc 90 ngày gần nhất, mặc định 30 ngày (BR-NK-07). */
public enum StatsPeriod {
    D7(7),
    D30(30),
    D90(90);

    private final int days;

    StatsPeriod(int days) {
        this.days = days;
    }

    public int days() {
        return days;
    }
}
