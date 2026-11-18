package com.lingualoop.backend.practice.service;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.ReviewPlanSentence;
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

    /**
     * Câu có thể ôn hôm nay của cả hai chế độ, thứ tự ưu tiên theo BR-HT-20, chưa cắt theo định mức. {@code dayStart} là
     * đầu ngày của học viên (theo múi giờ của họ): câu đã ôn từ mốc này trở đi bị loại (BR-HT-21).
     */
    List<ReviewPlanSentence> findReviewableToday(UUID userId, boolean userPro, Instant dayStart);

    /**
     * Hoãn câu sang ngày mai khi học viên bỏ qua trong phiên ôn (BR-HT-21): câu không được chọn lại hôm nay và không được
     * tính là đã ôn; câu vẫn ở trong danh sách. Câu không ở trong danh sách thì lỗi không tìm thấy.
     */
    void skip(UUID userId, UUID sentenceId, PracticeMode mode);

    /**
     * Số câu đã ôn từ {@code since} (đầu ngày của học viên) theo chế độ, để trừ vào Định mức ôn ngày. Chế độ chưa ôn câu
     * nào không có trong kết quả.
     */
    Map<PracticeMode, Integer> countReviewedSince(UUID userId, Instant since);

    /**
     * Đánh dấu câu "đã ôn hôm nay" sau một lượt trong phiên ôn câu (BR-HT-21). Câu phải đang trong danh sách và học viên
     * phải vừa có lượt thật ở chế độ đó; gọi lại nhiều lần không đổi gì thêm.
     */
    void markReviewed(UUID userId, UUID sentenceId, PracticeMode mode);
}
