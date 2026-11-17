package com.lingualoop.backend.review;

import java.util.UUID;

/** Lập kế hoạch cho phiên Ôn tập hằng ngày: thẻ đến hạn rồi câu cần ôn, theo mục tiêu ngày của học viên (UC-HT-05). */
public interface DailyReviewService {

    /** Số lượng thẻ, các câu được chọn và thời điểm thẻ kế tiếp đến hạn. Không lưu gì: mỗi lần gọi lập lại từ dữ liệu hiện tại. */
    DailyPlanView plan(UUID userId);
}
