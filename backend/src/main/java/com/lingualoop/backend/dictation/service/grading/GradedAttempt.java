package com.lingualoop.backend.dictation.service.grading;

import java.math.BigDecimal;
import java.util.List;

/** Kết quả chấm một lượt: điểm 0–100 (scale 2) và các từ đã chấm theo thứ tự hiển thị. */
public record GradedAttempt(BigDecimal score, List<GradedWord> words) {

    public GradedAttempt {
        words = List.copyOf(words);
    }
}
