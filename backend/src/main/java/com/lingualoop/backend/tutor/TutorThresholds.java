package com.lingualoop.backend.tutor;

/**
 * Các ngưỡng của Phiên gia sư. Gom một chỗ để chỉnh khi thử demo.
 */
public final class TutorThresholds {

    /** Từ có AccuracyScore dưới mức này thì đưa vào Danh sách từ lỗi và có thể mời gia sư. */
    public static final double LOW_WORD_SCORE = 60;

    /** Âm vị có điểm dưới mức này được coi là âm vị lỗi. */
    public static final double PHONEME_ERROR_SCORE = 60;

    /** Âm vị (hoặc từ) đạt mức này trong Lượt chấm thì coi là đã sửa được. */
    public static final double PASS_SCORE = 80;

    /** Số Lượt chấm tối đa cho mỗi từ; quay lại từ đó thì được số lượt mới. */
    public static final int MAX_ATTEMPTS_PER_WORD = 3;

    /** Số Lượt chấm cả câu tối đa mỗi phiên. */
    public static final int MAX_SENTENCE_ATTEMPTS = 3;

    /** Số từ tối đa trong Danh sách từ lỗi. */
    public static final int MAX_PRACTICE_WORDS = 8;

    /** Số Lượt lạc đề liên tiếp thì kết thúc phiên. */
    public static final int OFF_TOPIC_END_STREAK = 3;

    /** Trần thời lượng phiên, khớp giới hạn kết nối khoảng 10 phút của Gemini Live (ADR 0003). */
    public static final int SESSION_MAX_SECONDS = 600;

    /** Thời điểm frontend nhắc gia sư chốt lại. */
    public static final int WRAP_UP_AT_SECONDS = 540;

    /** Quá thời gian này mà gia sư chưa nói câu đầu tiên thì phiên là "không kết nối được". */
    public static final int START_TIMEOUT_SECONDS = 15;

    /** Im lặng chừng này thì gia sư hỏi người học còn muốn luyện không. */
    public static final int IDLE_ASK_SECONDS = 60;

    /** Im lặng chừng này thì kết thúc phiên. */
    public static final int IDLE_END_SECONDS = 90;

    /** Số câu tối thiểu giữa hai lần gia sư tự mở. */
    public static final int OFFER_COOLDOWN_SENTENCES = 3;

    /** Số câu gần nhất (tính cả câu vừa đọc) dùng để xét lỗi lặp lại. */
    public static final int REPEAT_WINDOW = 3;

    /** Số câu trong cửa sổ phải có cùng âm vị lỗi thì coi là lặp lại. */
    public static final int REPEAT_MIN_OCCURRENCES = 2;

    private TutorThresholds() {
    }
}
