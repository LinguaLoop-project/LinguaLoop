package com.lingualoop.backend.review;

import java.time.Instant;
import java.util.List;

import com.lingualoop.backend.practice.dto.ReviewPlanSentence;

/**
 * Kế hoạch Ôn tập hằng ngày (UC-HT-05). {@code cardQuota} là số thẻ tối đa của phiên; {@code cardsInPlan} là số thẻ
 * thực sự có (nhỏ hơn nếu ít thẻ đến hạn). {@code sentences} đã cắt theo định mức, Nghe chép trước rồi tới Shadowing;
 * {@code sentencesPending} là tổng số câu chưa ôn hôm nay (chưa cắt). {@code nextCardDueAt} là lúc thẻ kế tiếp đến hạn.
 * {@code suggestions} chỉ có khi không còn thẻ lẫn câu nào để ôn: việc gợi ý thay cho phiên ôn (trống ở các trường hợp khác).
 */
public record DailyPlanView(int dailyMinutes, int cardQuota, int cardsDue, int cardsInPlan, Instant nextCardDueAt,
        int sentenceQuotaPerMode, int sentencesPending, List<ReviewPlanSentence> sentences,
        TodaySuggestions suggestions) {

    public DailyPlanView {
        sentences = List.copyOf(sentences);
    }
}
