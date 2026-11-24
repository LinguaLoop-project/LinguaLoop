package com.lingualoop.backend.review;

import java.util.List;

import com.lingualoop.backend.vocab.dto.LearnView;

/**
 * Thẻ của phần ôn thẻ trong phiên Ôn tập hằng ngày, theo thứ tự thẻ đến hạn, từ mới rồi thẻ củng cố (BR-HT-29). Mỗi thẻ
 * kèm nguồn để giao diện biết thẻ nào chỉ luyện (thẻ củng cố không đổi lịch ôn, BR-HT-30).
 */
public record DailyCardsView(List<Item> cards) {

    public DailyCardsView {
        cards = List.copyOf(cards);
    }

    /** Nguồn của một thẻ trong phiên. */
    public enum Source {
        /** Thẻ đến hạn (BR-HT-13). */
        DUE,
        /** Từ mới của bộ từ mới (BR-HT-32). */
        NEW_WORD,
        /** Thẻ củng cố, chỉ luyện (BR-HT-30). */
        REINFORCE
    }

    public record Item(LearnView.Card card, Source source) {
    }
}
