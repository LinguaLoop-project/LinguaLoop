package com.lingualoop.backend.review;

/**
 * Định mức của một phiên Luyện tập hằng ngày theo mục tiêu ngày (BR-HT-24): số thẻ tối đa và số câu tối đa của mỗi chế độ
 * (Nghe chép, Shadowing chia đều).
 */
record DailyQuota(int cards, int sentencesPerMode) {

    static DailyQuota of(int dailyMinutes) {
        return switch (dailyMinutes) {
            case 10 -> new DailyQuota(15, 1);
            case 20 -> new DailyQuota(30, 2);
            case 30 -> new DailyQuota(40, 3);
            default -> new DailyQuota(20, 2); // 15 phút là mặc định; mức lạ rơi về mặc định
        };
    }
}
