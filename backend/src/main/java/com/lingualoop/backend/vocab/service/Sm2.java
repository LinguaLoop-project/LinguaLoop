package com.lingualoop.backend.vocab.service;

import java.time.Duration;

import com.lingualoop.backend.vocab.enums.CardStatus;

/**
 * Chấm flashcard theo SM-2 (BR-HT-10, BR-HT-11) và suy ra trạng thái thẻ (BR-HT-08). Thuần tính toán, không đụng cơ sở dữ
 * liệu, để học từ mới và ôn thẻ dùng chung một nơi.
 */
final class Sm2 {

    static final double INITIAL_EASINESS = 2.5;
    static final double MIN_EASINESS = 1.3;
    /** Khoảng ôn từ ngày này trở lên là Đã thuộc. */
    static final int MASTERED_DAYS = 21;
    static final Duration FORGOT_DELAY = Duration.ofMinutes(10);
    static final int[] QUALITIES = {1, 3, 4, 5};

    private Sm2() {
    }

    /** Lịch ôn của một thẻ; {@code intervalDays} bằng 0 khi chưa có lịch hoặc vừa quên. */
    record State(int repetitions, int intervalDays, double easiness) {
        static final State FRESH = new State(0, 0, INITIAL_EASINESS);
    }

    /** Kết quả chấm: lịch mới, trạng thái mới và khoảng chờ tới lần ôn tới. */
    record Result(State state, CardStatus status, Duration delay) {
    }

    static Result grade(State previous, int quality) {
        if (quality < 0 || quality > 5) {
            throw new IllegalArgumentException("quality must be 0..5: " + quality);
        }
        double easiness = Math.max(MIN_EASINESS, round2(previous.easiness()
                + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))));
        if (quality < 3) {
            return new Result(new State(0, 0, easiness), CardStatus.LEARNING, FORGOT_DELAY);
        }
        int repetitions = previous.repetitions() + 1;
        int interval = repetitions == 1 ? 1 : repetitions == 2 ? 6 : (int) Math.round(previous.intervalDays() * easiness);
        return new Result(new State(repetitions, interval, easiness), statusOf(repetitions, interval), Duration.ofDays(interval));
    }

    /**
     * Thẻ Mới được trả lời lần đầu ở cách học không chấm flashcard (BR-HT-12): Đang học, hẹn ôn sau 1 ngày, đúng hay
     * sai đều vậy.
     */
    static Result firstAnswer() {
        return new Result(new State(1, 1, INITIAL_EASINESS), CardStatus.LEARNING, Duration.ofDays(1));
    }

    static CardStatus statusOf(int repetitions, int intervalDays) {
        if (intervalDays >= MASTERED_DAYS) {
            return CardStatus.MASTERED;
        }
        return repetitions < 2 ? CardStatus.LEARNING : CardStatus.REVIEWING;
    }

    private static double round2(double value) {
        return Math.round(value * 100.0) / 100.0;
    }
}
