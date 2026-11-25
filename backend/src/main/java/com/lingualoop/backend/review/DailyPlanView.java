package com.lingualoop.backend.review;

import java.time.Instant;
import java.util.List;

import com.lingualoop.backend.practice.dto.ReviewPlanSentence;

/**
 * Kế hoạch Luyện tập hằng ngày (UC-HT-05) tính trên phần còn lại của Định mức ôn ngày (BR-HT-24) và lấp theo khung bài ngày
 * (BR-HT-29).
 * <ul>
 * <li>{@code cardQuota}: số thẻ tối đa của cả ngày; {@code cardsDue}: tổng số thẻ đang đến hạn.</li>
 * <li>{@code cardsInPlan}: số thẻ của phiên, bằng phần định mức còn lại sau khi lấp bằng thẻ đến hạn, từ mới rồi thẻ củng
 * cố (0 khi đã đủ); {@code cardSources} cho biết mỗi nguồn góp bao nhiêu thẻ.</li>
 * <li>{@code cardsDoneToday} và {@code cardsTarget}: tiến độ thẻ hôm nay, đã chặn không vượt mục tiêu của ngày.
 * {@code cardsMore}: số thẻ của một lượt "Ôn thêm" (không tính định mức).</li>
 * <li>{@code sentences}: câu của phiên, đã cắt theo phần định mức còn lại của từng chế độ, Nghe chép trước rồi tới
 * Shadowing; {@code sentencesPending}: tổng số câu chưa ôn hôm nay (chưa cắt).</li>
 * <li>{@code sentencesDoneToday} và {@code sentencesTarget}: tiến độ câu hôm nay, cộng cả hai chế độ.</li>
 * <li>{@code nextCardDueAt}: lúc thẻ kế tiếp đến hạn.</li>
 * <li>{@code suggestions}: chỉ có khi phiên trống (đã đủ định mức hoặc không còn gì để lấp), là việc gợi ý thay cho phiên
 * ôn.</li>
 * </ul>
 */
public record DailyPlanView(int dailyMinutes, int cardQuota, int cardsDue, int cardsInPlan, CardSources cardSources,
        int cardsDoneToday, int cardsTarget, int cardsMore, Instant nextCardDueAt, int sentenceQuotaPerMode,
        int sentencesPending, int sentencesDoneToday, int sentencesTarget, List<ReviewPlanSentence> sentences,
        TodaySuggestions suggestions) {

    public DailyPlanView {
        sentences = List.copyOf(sentences);
    }

    /** Số thẻ của phiên theo nguồn (BR-HT-29): thẻ đến hạn, từ mới và thẻ củng cố. */
    public record CardSources(int due, int newWords, int reinforce) {
    }
}
