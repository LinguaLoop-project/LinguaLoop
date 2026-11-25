package com.lingualoop.backend.review;

import java.util.UUID;

/**
 * Cách khung bài ngày lấp phần thẻ còn lại của Định mức ôn ngày (BR-HT-29): bao nhiêu thẻ từ mỗi nguồn, nguồn trên hết
 * mới lấy nguồn dưới. Thuần tính toán, không đụng cơ sở dữ liệu, nên kiểm thử được riêng.
 *
 * @param due       thẻ đến hạn (BR-HT-13)
 * @param newWords  từ mới của bộ {@code newWordsDeck}
 * @param reinforce thẻ củng cố (BR-HT-30)
 */
record DailyFrame(int due, int newWords, int reinforce, UUID newWordsDeck) {

    /** Mỗi ngày tối đa một phần ba định mức thẻ là từ mới. */
    static final int NEW_WORD_DIVISOR = 3;

    static final DailyFrame EMPTY = new DailyFrame(0, 0, 0, null);

    int total() {
        return due + newWords + reinforce;
    }

    /**
     * Giới hạn từ mới của cả ngày: tối đa ⌈định mức / 3⌉, giảm còn định mức trừ số thẻ đã hẹn vào ngày mai (không âm) để
     * ngày mai không quá tải (BR-HT-29).
     */
    static int newWordCap(int cardQuota, int scheduledTomorrow) {
        int base = (cardQuota + NEW_WORD_DIVISOR - 1) / NEW_WORD_DIVISOR;
        return Math.min(base, Math.max(0, cardQuota - scheduledTomorrow));
    }

    /**
     * Chia {@code remaining} ô còn lại của định mức cho ba nguồn theo thứ tự ưu tiên.
     *
     * @param dueAvailable       tổng số thẻ đến hạn
     * @param newWordsAllowed    số từ mới còn được đưa vào hôm nay (giới hạn ngày trừ phần đã đưa vào)
     * @param newWordsAvailable  số từ mới thực có trong bộ từ mới
     * @param reinforceAvailable số thẻ củng cố thực có
     */
    static DailyFrame fill(int remaining, int dueAvailable, int newWordsAllowed, int newWordsAvailable,
            int reinforceAvailable, UUID newWordsDeck) {
        int due = Math.min(Math.max(0, remaining), Math.max(0, dueAvailable));
        int left = Math.max(0, remaining) - due;
        int newWords = Math.min(left, Math.min(Math.max(0, newWordsAllowed), Math.max(0, newWordsAvailable)));
        left -= newWords;
        int reinforce = Math.min(left, Math.max(0, reinforceAvailable));
        return new DailyFrame(due, newWords, reinforce, newWords > 0 ? newWordsDeck : null);
    }
}
