package com.lingualoop.backend.tutor;

/**
 * Chỉ dẫn tiếng Việt gửi cho gia sư trong kết quả tool. Backend quyết định, lời này chỉ giúp gia sư diễn đạt
 * và gọi đúng tool tiếp theo.
 */
public final class TutorInstructions {

    private static final String CALL_WORD_RETRY = "gọi request_retry(target=\"word\")";
    private static final String CALL_SENTENCE_RETRY = "mời người học đọc cả câu bằng request_retry(target=\"sentence\")";

    private TutorInstructions() {
    }

    /** Mô tả một Từ luyện cho gia sư: từ, âm vị, điểm, mẹo. */
    public static String describe(PracticeWord w) {
        if (w.phoneme() == null) {
            return "từ \"" + w.word() + "\" (chưa có mẹo soạn sẵn, tự giải thích ngắn gọn khẩu hình)";
        }
        String tip = w.tipVi() == null || w.tipVi().isBlank()
                ? "chưa có mẹo soạn sẵn, tự giải thích ngắn gọn khẩu hình"
                : "mẹo: " + w.tipVi();
        return "từ \"" + w.word() + "\", âm /" + w.phoneme() + "/ (" + Math.round(w.score()) + "/100; " + tip + ")";
    }

    public static String afterWordAttempt(AttemptRule.WordDecision decision, double score, int attemptNumber,
                                          PracticeWord word, PracticeWord next) {
        long points = Math.round(score);
        return switch (decision.nextStep()) {
            case RETRY_WORD -> "Chưa đạt (" + points + " điểm, lượt " + attemptNumber + "/"
                    + TutorThresholds.MAX_ATTEMPTS_PER_WORD + "). Nhắc lại một ý chính của mẹo, đọc mẫu từ \""
                    + word.word() + "\" lần nữa, rồi " + CALL_WORD_RETRY + ".";
            case NEXT_WORD -> verdict(decision, points, attemptNumber, word) + " Đã chuyển sang " + describe(next)
                    + ". Giới thiệu ngắn, đọc mẫu rồi " + CALL_WORD_RETRY
                    + "; nếu người học muốn từ khác thì gọi switch_word.";
            case SENTENCE -> verdict(decision, points, attemptNumber, word)
                    + " Đã hết danh sách từ lỗi: " + CALL_SENTENCE_RETRY + ".";
            case END -> throw new IllegalArgumentException("A word attempt never ends the session");
        };
    }

    public static String afterSentenceAttempt(AttemptRule.NextStep step, double score, PracticeWord next) {
        long points = Math.round(score);
        return switch (step) {
            case END -> "Người học đã đọc cả câu (" + points + " điểm). Khen và tổng kết 1–2 câu (từ nào đã đạt, "
                    + "từ nào cần luyện thêm), rồi gọi end_session(reason=\"completed\").";
            case NEXT_WORD -> "Đã chấm cả câu (" + points + " điểm). Còn " + describe(next)
                    + " chưa luyện: hỏi người học có muốn luyện tiếp không. Nếu có thì giải thích rồi "
                    + CALL_WORD_RETRY + "; nếu không thì gọi end_session(reason=\"learner_exit\").";
            default -> throw new IllegalArgumentException("Unexpected step after a sentence attempt: " + step);
        };
    }

    public static String afterSwitch(WordProgress progress) {
        return "Đã chuyển sang " + describe(progress.word()) + ". Còn " + progress.attemptsLeft()
                + " lượt chấm cho từ này. Giải thích ngắn khẩu hình, đọc mẫu rồi " + CALL_WORD_RETRY + ".";
    }

    public static String onTopic() {
        return "Ghi nhận. Trả lời theo quy tắc về chủ đề: chỉ bàn về câu đang học.";
    }

    public static String offTopic(int streak) {
        int max = TutorThresholds.OFF_TOPIC_END_STREAK;
        if (streak >= max) {
            return "Lạc đề lần " + max + "/" + max + " liên tiếp: phiên kết thúc. Chào ngắn gọn, nói phiên kết thúc "
                    + "vì đi xa bài học và mời người học quay lại bài. Không gọi thêm tool nào.";
        }
        if (streak == max - 1) {
            return "Lạc đề lần " + streak + "/" + max + " liên tiếp. Không trả lời nội dung. Nói rõ: nếu tiếp tục "
                    + "chủ đề này mình sẽ kết thúc phiên để bạn quay lại bài. Mời người học quay lại câu đang học.";
        }
        return "Lạc đề lần " + streak + "/" + max + ". Nếu người học hỏi điều ngắn gọn thì trả lời tối đa một câu; "
                + "rồi nhắc nhẹ quay lại câu đang học (đọc lại câu, nhắc từ đang luyện).";
    }

    private static String verdict(AttemptRule.WordDecision decision, long points, int attemptNumber, PracticeWord word) {
        if (decision.passed()) {
            return "Từ \"" + word.word() + "\" đạt " + points + " điểm. Khen ngắn gọn.";
        }
        return "Từ \"" + word.word() + "\" chưa đạt sau " + attemptNumber + " lượt (" + points
                + " điểm); ghi nhận cần luyện thêm, động viên một câu, đừng nài.";
    }
}
