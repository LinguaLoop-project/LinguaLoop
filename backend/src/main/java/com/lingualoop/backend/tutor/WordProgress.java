package com.lingualoop.backend.tutor;

/**
 * Tiến độ một Từ luyện trong phiên. Bất biến: mỗi thay đổi tạo bản mới nên đọc ở luồng khác luôn nhất quán.
 *
 * @param attempts số Lượt chấm đã dùng (tính từ lần bắt đầu luyện gần nhất)
 * @param best     điểm tốt nhất trong các Lượt chấm; null khi chưa chấm lần nào
 */
public record WordProgress(PracticeWord word, int attempts, WordStatus status, Double best) {

    public static WordProgress fresh(PracticeWord word) {
        return new WordProgress(word, 0, WordStatus.PENDING, null);
    }

    public String key() {
        return word.key();
    }

    public int attemptsLeft() {
        return Math.max(0, TutorThresholds.MAX_ATTEMPTS_PER_WORD - attempts);
    }

    /** Quay lại từ này: được số Lượt chấm mới. Từ đã đạt vẫn giữ trạng thái đạt. */
    public WordProgress restarted() {
        WordStatus next = status == WordStatus.NEEDS_PRACTICE ? WordStatus.PENDING : status;
        return new WordProgress(word, 0, next, best);
    }
}
