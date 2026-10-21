package com.lingualoop.backend.practice.dto;

import com.lingualoop.backend.practice.enums.AttemptOutcome;
import com.lingualoop.backend.practice.enums.AttemptWordClass;

/** Kết quả một từ của một lượt đã lưu. Từ thừa không có expectedWord và wordClass. */
public record AttemptWordView(int position, String expectedWord, String actualWord, AttemptOutcome outcome,
        AttemptWordClass wordClass) {
}
