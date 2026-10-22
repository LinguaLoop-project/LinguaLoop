package com.lingualoop.backend.tutor;

import java.util.List;
import java.util.Set;

import org.springframework.stereotype.Component;

/**
 * Quyết định gia sư có tự mở sau câu vừa đọc hay không (BR-TUTOR-02); chỉ gọi khi Chế độ gia sư đang bật. Từ thừa
 * không có trong câu mẫu nên không được tính.
 */
@Component
public class TutorOfferPolicy {

    public enum Reason {
        LOW_WORD_SCORE,
        REPEATED_PHONEME_ERROR,
        NO_SIGNIFICANT_ERROR,
        COOLDOWN
    }

    public record Decision(boolean offer, Reason reason) {
    }

    /**
     * @param current                 kết quả chấm của câu vừa đọc
     * @param previous                kết quả của các câu trước trong bài, câu gần nhất đứng đầu
     * @param sentencesSinceLastOffer số lượt đã đọc kể từ lượt của lần mời gần nhất, tính cả lượt vừa đọc;
     *                                null nếu chưa mời lần nào
     */
    public record Context(SentenceResult current, List<SentenceResult> previous, Integer sentencesSinceLastOffer) {
    }

    public Decision decide(Context ctx) {
        if (ctx.sentencesSinceLastOffer() != null
                && ctx.sentencesSinceLastOffer() < TutorThresholds.OFFER_COOLDOWN_SENTENCES) {
            return new Decision(false, Reason.COOLDOWN);
        }
        if (hasLowWord(ctx.current())) {
            return new Decision(true, Reason.LOW_WORD_SCORE);
        }
        if (hasRepeatedPhonemeError(ctx.current(), ctx.previous())) {
            return new Decision(true, Reason.REPEATED_PHONEME_ERROR);
        }
        return new Decision(false, Reason.NO_SIGNIFICANT_ERROR);
    }

    private boolean hasLowWord(SentenceResult current) {
        return current.words().stream()
                .anyMatch(w -> !w.inserted() && w.accuracy() < TutorThresholds.LOW_WORD_SCORE);
    }

    /** Một âm đích cần sửa ở câu vừa đọc và cũng cần sửa ở đủ số câu trong cửa sổ gần nhất. */
    private boolean hasRepeatedPhonemeError(SentenceResult current, List<SentenceResult> previous) {
        List<SentenceResult> window = previous == null ? List.of()
                : previous.subList(0, Math.min(previous.size(), TutorThresholds.REPEAT_WINDOW - 1));
        for (String phoneme : current.errorSymbols()) {
            long occurrences = 1 + window.stream()
                    .map(SentenceResult::errorSymbols)
                    .filter((Set<String> errors) -> errors.contains(phoneme))
                    .count();
            if (occurrences >= TutorThresholds.REPEAT_MIN_OCCURRENCES) {
                return true;
            }
        }
        return false;
    }
}
