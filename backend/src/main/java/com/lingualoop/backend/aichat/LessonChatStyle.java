package com.lingualoop.backend.aichat;

import java.util.Locale;
import java.util.Map;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

/**
 * Kiểu trò chuyện của phiên giọng nói, học viên chọn ở màn giới thiệu. Cả ba đều bám nội dung bài (BR-AI-07) và tính tối
 * đa 5 lượt mời học viên nói (BR-AI-11); chỉ khác cách gia sư mời nói.
 */
enum LessonChatStyle {
    /** Hỏi đáp: gia sư hỏi về chi tiết trong video và hỏi tiếp theo điều học viên vừa nói. */
    QA,
    /** Phỏng vấn: học viên đóng vai nhân vật hoặc người nói trong video, gia sư là phóng viên. */
    INTERVIEW,
    /** Kể lại: gia sư giả vờ chưa xem video, học viên kể lại, gia sư hỏi những chỗ còn thiếu. */
    RETELL;

    String dbValue() {
        return name().toLowerCase(Locale.ROOT);
    }

    /** Thiếu thì là hỏi đáp; giá trị lạ thì báo lỗi thay vì đoán. */
    static LessonChatStyle parse(String value) {
        if (value == null || value.isBlank()) {
            return QA;
        }
        try {
            return valueOf(value.strip().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.AI_CHAT_ANSWER_INVALID, Map.of("reason", "style"));
        }
    }

    static LessonChatStyle fromDb(String value) {
        return value == null ? QA : valueOf(value.toUpperCase(Locale.ROOT));
    }
}
