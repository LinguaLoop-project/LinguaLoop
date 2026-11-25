package com.lingualoop.backend.vocab.service;

import java.time.Instant;
import java.util.List;
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
     * Như {@link #queue(UUID, UUID)} nhưng lấy tối đa {@code limit} thẻ (1 đến 50, trống là 50): phiên Luyện tập hằng ngày
     * lấy theo định mức của mục tiêu ngày (BR-HT-24).
     */
    ReviewView.Queue queue(UUID userId, UUID deckId, Integer limit);

    /** Tổng số thẻ đến hạn của mọi bộ và thời điểm thẻ kế tiếp đến hạn, không lấy nội dung thẻ. */
    ReviewView.DueSummary dueSummary(UUID userId);

    /**
     * Số thẻ khác nhau đã chấm trong lượt ôn từ {@code since}, để trừ vào Định mức ôn ngày (BR-HT-24). Lượt học từ mới
     * không được tính.
     */
    int countReviewedSince(UUID userId, Instant since);

    /** Mở phiên ôn mới và đóng phiên còn mở trước đó (BR-HT-15). */
    LearnView.SessionRef openSession(UUID userId, UUID deckId);

    // ---- Nguồn lấp của khung bài ngày (BR-HT-29, BR-HT-30) ----

    /**
     * Tối đa {@code limit} từ mới của bộ {@code deckId} theo thứ tự phần rồi thứ tự thẻ trong phần. Rỗng nếu bộ không phải
     * bộ thư viện học viên được học (bộ Pro với gói Free).
     */
    List<LearnView.Card> newWordCards(UUID userId, UUID deckId, int limit);

    /** Số từ mới còn lại của bộ {@code deckId}, đếm tới {@code cap}. */
    int countNewWords(UUID userId, UUID deckId, int cap);

    /**
     * Số từ mới học viên đã được đưa vào từ {@code since}: thẻ có lần chấm đầu tiên trong lượt ôn, vào hôm nay. Thẻ học ở
     * trang Học từ mới và thẻ của bộ "Từ đã lưu" không tính.
     */
    int countNewWordsStartedSince(UUID userId, Instant since);

    /** Tối đa {@code limit} thẻ củng cố, hệ số dễ thấp trước; không có thẻ đã chấm từ {@code since} (BR-HT-30). */
    List<LearnView.Card> reinforceCards(UUID userId, Instant since, int limit);

    /** Số thẻ củng cố hiện có, đếm tới {@code cap}. */
    int countReinforce(UUID userId, Instant since, int cap);

    /** Số thẻ đã học có lịch hẹn trong {@code [from, to)}, để biết ngày mai đã nhiều thẻ chưa. */
    int countScheduledBetween(UUID userId, Instant from, Instant to);
}
