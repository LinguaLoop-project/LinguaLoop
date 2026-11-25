package com.lingualoop.backend.review;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.ReviewPlanSentence;

/** Lập kế hoạch cho phiên Luyện tập hằng ngày: thẻ đến hạn rồi câu cần ôn, theo mục tiêu ngày của học viên (UC-HT-05). */
public interface DailyReviewService {

    /** Số lượng thẻ, các câu được chọn và thời điểm thẻ kế tiếp đến hạn. Không lưu gì: mỗi lần gọi lập lại từ dữ liệu hiện tại. */
    DailyPlanView plan(UUID userId);

    /**
     * Thẻ của phần ôn thẻ: thẻ đến hạn, rồi từ mới, rồi thẻ củng cố, đủ phần định mức còn lại của ngày (BR-HT-29). Với
     * {@code extra} (lượt "Ôn thêm") chỉ có thẻ đến hạn, tối đa bằng định mức thẻ, không tính định mức (BR-HT-24).
     */
    DailyCardsView dailyCards(UUID userId, boolean extra);

    /**
     * Các câu của phiên Ôn câu riêng (UC-HT-04): mỗi chế độ tối đa {@code perMode} câu theo BR-HT-20, Nghe chép trước rồi
     * tới Shadowing. Câu đã ôn hôm nay không được chọn lại nên "Ôn thêm" gọi lại sẽ ra nhóm câu kế tiếp.
     */
    List<ReviewPlanSentence> sentencePlan(UUID userId, int perMode);

    /**
     * Phiên Ôn câu khi học viên bấm "Luyện lại" ở một câu trong danh sách Câu cần ôn: chỉ trả đúng câu đó (rỗng nếu câu
     * không ở trong danh sách hoặc thuộc bài Pro mà học viên chưa có gói). Thiếu {@code sentenceId} hoặc {@code mode} thì
     * giống {@link #sentencePlan(UUID, int)}.
     *
     * @param sentenceId câu muốn luyện lại, hoặc null để lấy kế hoạch chung
     * @param mode       chế độ của mục trong danh sách, hoặc null để lấy kế hoạch chung
     */
    List<ReviewPlanSentence> sentencePlan(UUID userId, int perMode, UUID sentenceId, PracticeMode mode);
}
