package com.lingualoop.backend.vocab.service;

import java.util.UUID;

import com.lingualoop.backend.vocab.dto.LearnView;
import com.lingualoop.backend.vocab.dto.ReviewView;

/** Ôn thẻ từ vựng đến hạn (UC-HT-03). Câu trả lời của lượt ôn đi qua {@link VocabLearnService#answer}. */
public interface VocabReviewService {

    /**
     * Hàng đợi ôn: tối đa 50 thẻ đến hạn của mọi bộ, hoặc chỉ của bộ {@code deckId} nếu có (BR-HT-13, BR-HT-14). 404
     * nếu bộ không có hoặc không phải của học viên (BR-HT-06).
     */
    default ReviewView.Queue queue(UUID userId, UUID deckId) {
        return queue(userId, deckId, null);
    }

    /**
     * Như {@link #queue(UUID, UUID)} nhưng lấy tối đa {@code limit} thẻ (1 đến 50, trống là 50): phiên Ôn tập hằng ngày
     * lấy theo định mức của mục tiêu ngày (BR-HT-24).
     */
    ReviewView.Queue queue(UUID userId, UUID deckId, Integer limit);

    /** Tổng số thẻ đến hạn của mọi bộ và thời điểm thẻ kế tiếp đến hạn, không lấy nội dung thẻ. */
    ReviewView.DueSummary dueSummary(UUID userId);

    /** Mở phiên ôn mới và đóng phiên còn mở trước đó (BR-HT-15). */
    LearnView.SessionRef openSession(UUID userId, UUID deckId);
}
