package com.lingualoop.backend.practice.service;

import java.time.Instant;
import java.util.Collection;
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

    /**
     * Lưu câu từ Học thụ động (BR-TC-17): thêm vào danh sách với lý do {@code manual} mà không cần lượt nào trước, vì
     * lời thoại đã hiện công khai. Bên gọi tự kiểm câu còn hiển thị và quyền Pro. Câu đã ở trong danh sách giữ nguyên.
     */
    void pinWithoutAttempt(UUID userId, UUID sentenceId, PracticeMode mode);

    /** Gỡ câu khỏi danh sách ("Đã ổn" hoặc bỏ ghim); câu không ở trong danh sách thì không làm gì. */
    void resolve(UUID userId, UUID sentenceId, PracticeMode mode);

    /** Id các câu đang cần ôn của chế độ trong một bài. */
    Set<UUID> findPendingSentenceIds(UUID userId, UUID lessonId, PracticeMode mode);

    /** Id các câu đang cần ôn của chế độ trong các bài. */
    Set<UUID> findPendingSentenceIds(UUID userId, Collection<UUID> lessonIds, PracticeMode mode);

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
     * Câu luyện thêm của từng chế độ, tối đa {@code perMode} câu mỗi chế độ (BR-HT-31): câu đã luyện, không ở trong danh
     * Câu cần ôn, lượt gần nhất dưới 80 điểm, chưa luyện, chưa ôn và chưa bỏ qua từ {@code dayStart}. Dùng để lấp phần thiếu
     * của phiên Ôn tập hằng ngày; hệ thống không thêm các câu này vào danh sách.
     */
    List<ReviewPlanSentence> findExtraToday(UUID userId, boolean userPro, Instant dayStart, int perMode);

    /** Lấy một câu cần ôn cụ thể của học viên để mở trực tiếp màn Ôn câu. */
    List<ReviewPlanSentence> findSingleReviewSentence(UUID userId, UUID sentenceId, PracticeMode mode, boolean userPro);

    /**
     * Hoãn câu sang ngày mai khi học viên bỏ qua trong phiên ôn (BR-HT-21): câu không được chọn lại hôm nay và không được
     * tính là đã ôn; câu vẫn ở trong danh sách. Câu không ở trong danh sách thì được coi là câu luyện thêm (BR-HT-31) nếu
     * học viên đã luyện nó ở chế độ đó, còn không thì lỗi không tìm thấy.
     */
    void skip(UUID userId, UUID sentenceId, PracticeMode mode);

    /**
     * Số câu đã ôn từ {@code since} (đầu ngày của học viên) theo chế độ, để trừ vào Định mức ôn ngày. Chế độ chưa ôn câu
     * nào không có trong kết quả.
     */
    Map<PracticeMode, Integer> countReviewedSince(UUID userId, Instant since);

    /**
     * Đánh dấu câu "đã ôn hôm nay" sau một lượt trong phiên ôn câu (BR-HT-21). Học viên phải vừa có lượt thật ở chế độ đó;
     * gọi lại nhiều lần không đổi gì thêm. Câu ngoài danh sách chỉ được đánh dấu như câu luyện thêm (BR-HT-31) khi học viên
     * đã luyện nó ở chế độ đó, còn không thì lỗi không tìm thấy.
     */
    void markReviewed(UUID userId, UUID sentenceId, PracticeMode mode);
}
