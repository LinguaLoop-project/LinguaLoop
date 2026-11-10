package com.lingualoop.backend.lesson.enums;

import java.util.Locale;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;

/** Trạng thái học của một bài đối với người dùng hiện tại, dùng làm bộ lọc ở thư viện bài. */
public enum LessonState {
    /** Chưa bắt đầu: chưa có lượt làm nào trong bài. */
    TODO,
    /** Đang học: đã có lượt làm nhưng chưa hoàn thành. */
    DOING,
    /** Đã hoàn thành: ở một chế độ, mọi câu của bài đều có ít nhất một lượt. */
    DONE;

    /** Rỗng/null nghĩa là không lọc; giá trị lạ trả 400 thay vì lặng lẽ bỏ qua. */
    public static LessonState parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "state phải là todo, doing hoặc done");
        }
    }
}
