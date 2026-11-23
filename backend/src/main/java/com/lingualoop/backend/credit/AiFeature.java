package com.lingualoop.backend.credit;

import java.util.Locale;

/**
 * Năm tính năng tính credit (BR-GA-04); khớp CHECK của {@code ai_feature_prices.feature}. Đơn vị tính: nhận xét AI mỗi
 * lần, phiên gia sư mỗi phiên, thực hành theo bài mỗi cuộc trò chuyện, gợi ý dịch mỗi câu, tạo bài từ YouTube mỗi bài.
 */
public enum AiFeature {
    SHADOWING_FEEDBACK,
    LESSON_CHAT,
    TUTOR_SESSION,
    LESSON_SUGGEST,
    LESSON_IMPORT;

    /** Giá trị lưu trong DB (chữ thường). */
    public String dbValue() {
        return name().toLowerCase(Locale.ROOT);
    }
}
