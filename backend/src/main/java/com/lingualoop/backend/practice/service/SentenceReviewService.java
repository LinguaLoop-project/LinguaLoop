package com.lingualoop.backend.practice.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.ReviewSentenceView;

/** Danh sách Câu cần ôn, một danh sách riêng cho mỗi chế độ luyện (nghe chép, Shadowing). */
public interface SentenceReviewService {

    /**
     * Cập nhật danh sách của chế độ theo điểm của lượt vừa lưu: dưới 60 thì thêm câu (lý do {@code low_score}),
     * từ 80 trở lên thì gỡ câu. Trả về true nếu câu nằm trong danh sách sau lượt này.
     */
    boolean recordScore(UUID userId, UUID sentenceId, PracticeMode mode, BigDecimal score);

    /** Thêm câu bằng tay (lý do {@code manual}); chỉ thêm được câu đã có lượt ở chế độ đó. */
    void pin(UUID userId, UUID sentenceId, PracticeMode mode);

    /** Gỡ câu khỏi danh sách ("Đã ổn" hoặc bỏ ghim); câu không ở trong danh sách thì không làm gì. */
    void resolve(UUID userId, UUID sentenceId, PracticeMode mode);

    /** Id các câu đang cần ôn của chế độ trong một bài. */
    Set<UUID> findPendingSentenceIds(UUID userId, UUID lessonId, PracticeMode mode);

    /**
     * Câu đang cần ôn, điểm lượt gần nhất thấp trước. {@code mode} null là cả hai chế độ; {@code lessonSlug} null là
     * mọi bài.
     */
    List<ReviewSentenceView> list(UUID userId, PracticeMode mode, String lessonSlug);
}
