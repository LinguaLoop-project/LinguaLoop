package com.lingualoop.backend.review;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.practice.dto.ReviewPlanSentence;

/** Lập kế hoạch cho phiên Ôn tập hằng ngày: thẻ đến hạn rồi câu cần ôn, theo mục tiêu ngày của học viên (UC-HT-05). */
public interface DailyReviewService {

    /** Số lượng thẻ, các câu được chọn và thời điểm thẻ kế tiếp đến hạn. Không lưu gì: mỗi lần gọi lập lại từ dữ liệu hiện tại. */
    DailyPlanView plan(UUID userId);

    /**
     * Các câu của phiên Ôn câu riêng (UC-HT-04): mỗi chế độ tối đa {@code perMode} câu theo BR-HT-20, Nghe chép trước rồi
     * tới Shadowing. Câu đã ôn hôm nay không được chọn lại nên "Ôn thêm" gọi lại sẽ ra nhóm câu kế tiếp.
     */
    List<ReviewPlanSentence> sentencePlan(UUID userId, int perMode);
}
