package com.lingualoop.backend.vocab.service;

import java.util.UUID;

import com.lingualoop.backend.vocab.dto.LearnView;
import com.lingualoop.backend.vocab.dto.ReviewView;

/** Ôn thẻ từ vựng đến hạn (UC-HT-03). Câu trả lời của lượt ôn đi qua {@link VocabLearnService#answer}. */
public interface VocabReviewService {

    /**
     * Hàng đợi ôn: tối đa 50 thẻ đến hạn của mọi bộ, hoặc chỉ của bộ {@code deckSlug} nếu có (BR-HT-13, BR-HT-14). 404
     * nếu bộ không có hoặc không phải của học viên (BR-HT-06).
     */
    ReviewView.Queue queue(UUID userId, String deckSlug);

    /** Mở phiên ôn mới và đóng phiên còn mở trước đó (BR-HT-15). */
    LearnView.SessionRef openSession(UUID userId, String deckSlug);
}
