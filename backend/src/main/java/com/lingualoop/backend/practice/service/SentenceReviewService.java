package com.lingualoop.backend.practice.service;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.ReviewSentenceView;
import com.lingualoop.backend.practice.enums.ReviewReason;

/** Danh sách Câu cần ôn, một danh sách riêng cho mỗi chế độ luyện (nghe chép, Shadowing). */
public interface SentenceReviewService {

    /**
     * Thêm câu vào danh sách; chỉ thêm được câu đã có lượt ở chế độ đó. {@code reason} là {@code manual} khi người học tự
     * ghim, {@code low_score} khi người học chọn lưu ở hộp hỏi sau lượt điểm thấp. Hệ thống không tự thêm hay tự gỡ câu.
     */
    void pin(UUID userId, UUID sentenceId, PracticeMode mode, ReviewReason reason);

    /** Gỡ câu khỏi danh sách ("Đã ổn" hoặc bỏ ghim); câu không ở trong danh sách thì không làm gì. */
    void resolve(UUID userId, UUID sentenceId, PracticeMode mode);

    /** Id các câu đang cần ôn của chế độ trong một bài. */
    Set<UUID> findPendingSentenceIds(UUID userId, UUID lessonId, PracticeMode mode);

    /**
     * Câu đang cần ôn, điểm lượt gần nhất thấp trước. {@code mode} null là cả hai chế độ; {@code lessonId} null là
     * mọi bài.
     */
    List<ReviewSentenceView> list(UUID userId, PracticeMode mode, UUID lessonId);
}
