package com.lingualoop.backend.vocab.dto;

import java.time.Instant;
import java.util.List;

/** Hàng đợi ôn thẻ đến hạn (UC-HT-03). */
public final class ReviewView {

    private ReviewView() {
    }

    /**
     * Một lượt ôn: tối đa 50 thẻ đến hạn, thẻ đến hạn sớm nhất trước (BR-HT-14). {@code dueTotal} là tổng số thẻ đến hạn
     * (có thể nhiều hơn số thẻ trả về, để hiện "Ôn tiếp"). {@code nextDueAt} là thời điểm thẻ kế tiếp đến hạn, trống nếu
     * chưa có thẻ nào được hẹn. {@code deck} chỉ có khi ôn riêng một bộ ("Ôn bộ này").
     */
    public record Queue(LearnView.DeckRef deck, List<LearnView.Card> cards, int dueTotal, Instant nextDueAt) {
    }
}
