package com.lingualoop.backend.credit;

import java.util.Locale;

/** Bốn tính năng AI tính credit; khớp CHECK của {@code ai_feature_prices.feature}. */
public enum AiFeature {
    SHADOWING_FEEDBACK,
    LESSON_CHAT,
    TUTOR_SESSION,
    LESSON_SUGGEST;

    /** Giá trị lưu trong DB (chữ thường). */
    public String dbValue() {
        return name().toLowerCase(Locale.ROOT);
    }
}
