package com.lingualoop.backend.lesson.enums;

import java.util.Locale;

/** Trạng thái bài học, khớp CHECK của {@code lessons.status} ('draft', 'published'). */
public enum LessonStatus {
    /** Bản nháp: chỉ chủ bài thấy. */
    DRAFT,
    /** Đã xuất bản: học viên thấy trong thư viện. */
    PUBLISHED;

    /** Giá trị lưu trong DB. */
    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static LessonStatus fromValue(String value) {
        return valueOf(value.toUpperCase(Locale.ROOT));
    }
}
