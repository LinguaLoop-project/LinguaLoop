package com.lingualoop.backend.dictation.service.grading;

import com.lingualoop.backend.dictation.service.token.WordClass;

/**
 * Kết quả của một từ. position, display, expectedWord, wordClass là
 * null ở từ thừa (inserted); expectedWord/actualWord là dạng chuẩn hóa.
 * homophone là true khi lỗi misspelled thực ra là từ đồng âm (chỉ để hiển thị, không lưu).
 */
public record GradedWord(Integer position, String display, String expectedWord, String actualWord,
        WordClass wordClass, WordOutcome outcome, boolean homophone) {
}
