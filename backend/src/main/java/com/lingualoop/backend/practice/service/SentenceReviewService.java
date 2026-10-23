package com.lingualoop.backend.practice.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.lingualoop.backend.practice.dto.ReviewSentenceView;

/** Danh sách Câu cần ôn của nghe chép. */
public interface SentenceReviewService {

    /**
     * Cập nhật danh sách theo điểm của lượt nghe chép vừa lưu: dưới 60 thì thêm câu (lý do {@code low_score}),
     * từ 80 trở lên thì gỡ câu. Trả về true nếu câu nằm trong danh sách sau lượt này.
     */
    boolean recordDictationScore(UUID userId, UUID sentenceId, BigDecimal score);

    /** Thêm câu bằng tay (lý do {@code manual}); chỉ thêm được câu đã có lượt nghe chép. */
    void pin(UUID userId, UUID sentenceId);

    /** Gỡ câu khỏi danh sách ("Đã ổn" hoặc bỏ ghim); câu không ở trong danh sách thì không làm gì. */
    void resolve(UUID userId, UUID sentenceId);

    /** Id các câu đang cần ôn trong một bài. */
    Set<UUID> findPendingSentenceIds(UUID userId, UUID lessonId);

    /** Câu đang cần ôn, điểm lượt gần nhất thấp trước. */
    List<ReviewSentenceView> list(UUID userId);
}
