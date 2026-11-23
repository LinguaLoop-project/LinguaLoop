package com.lingualoop.backend.stats.dto;

/**
 * Mục tiêu câu luyện trong ngày (BR-TH-18).
 *
 * @param sentences số câu khác nhau đã luyện Nghe chép hoặc Shadowing trong ngày lịch hôm nay
 * @param target    mục tiêu câu mỗi ngày, bằng số phút học mục tiêu của học viên
 */
public record TodayGoalView(long sentences, int target) {
}
