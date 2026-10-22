package com.lingualoop.backend.tutor;

import org.springframework.stereotype.Component;

/**
 * Luật Lượt chấm: mỗi từ tối đa 3 lượt, đạt (từ 80 điểm) hoặc hết lượt thì sang từ kế tiếp; hết danh sách thì
 * đọc cả câu. Backend quyết định, gia sư chỉ làm theo instruction.
 */
@Component
public class AttemptRule {

    public enum NextStep { RETRY_WORD, NEXT_WORD, SENTENCE, END }

    /**
     * @param exhausted hết lượt mà chưa đạt: từ được đánh dấu "cần luyện thêm"
     */
    public record WordDecision(boolean passed, boolean exhausted, NextStep nextStep) {
    }

    /**
     * @param attemptNumber     số Lượt chấm đã dùng cho từ này, tính cả lượt vừa chấm (bắt đầu từ 1)
     * @param otherWordsPending còn từ nào khác chưa luyện trong danh sách
     */
    public WordDecision afterWordAttempt(int attemptNumber, double score, boolean otherWordsPending) {
        if (attemptNumber < 1 || attemptNumber > TutorThresholds.MAX_ATTEMPTS_PER_WORD) {
            throw new IllegalArgumentException(
                    "attemptNumber must be between 1 and " + TutorThresholds.MAX_ATTEMPTS_PER_WORD);
        }
        boolean passed = score >= TutorThresholds.PASS_SCORE;
        boolean exhausted = !passed && attemptNumber >= TutorThresholds.MAX_ATTEMPTS_PER_WORD;
        if (!passed && !exhausted) {
            return new WordDecision(false, false, NextStep.RETRY_WORD);
        }
        return new WordDecision(passed, exhausted, otherWordsPending ? NextStep.NEXT_WORD : NextStep.SENTENCE);
    }

    /** Đọc cả câu chỉ kết thúc phiên khi không còn từ nào chưa luyện. */
    public NextStep afterSentenceAttempt(boolean wordsPending) {
        return wordsPending ? NextStep.NEXT_WORD : NextStep.END;
    }
}
