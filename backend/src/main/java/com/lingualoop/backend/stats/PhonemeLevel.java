package com.lingualoop.backend.stats;

/** Mức hiển thị của một âm vị trên Bản đồ 44 âm vị (BR-TH-09). */
final class PhonemeLevel {

    /** Số lần gặp tối thiểu để một âm được tính tỷ lệ lỗi (BR-TH-11). */
    static final int MIN_ENCOUNTERS = 5;

    static final String INSUFFICIENT = "insufficient";
    static final String GOOD = "good";
    static final String ATTENTION = "attention";
    static final String BAD = "bad";

    private PhonemeLevel() {
    }

    /** Dưới 5 lần gặp là chưa đủ dữ liệu; dưới 15% là tốt; từ 15% đến 30% là cần chú ý; trên 30% là hay sai. */
    static String of(long total, long errors) {
        if (total < MIN_ENCOUNTERS) {
            return INSUFFICIENT;
        }
        // So sánh bằng số nguyên để 15% và 30% không bị sai số làm tròn.
        if (errors * 100 < 15 * total) {
            return GOOD;
        }
        return errors * 100 <= 30 * total ? ATTENTION : BAD;
    }

    /** Tỷ lệ lỗi làm tròn; null khi chưa gặp lần nào. */
    static Integer percent(long total, long errors) {
        return total <= 0 ? null : (int) Math.round(errors * 100.0 / total);
    }
}
