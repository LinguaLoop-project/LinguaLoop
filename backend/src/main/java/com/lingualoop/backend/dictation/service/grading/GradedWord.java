package com.lingualoop.backend.dictation.service.grading;

import com.lingualoop.backend.dictation.service.WordClass;

/**
 * Kết quả của một từ. {@code position}, {@code display}, {@code expectedWord}, {@code wordClass} là
 * {@code null} ở từ thừa ({@code inserted}); {@code expectedWord}/{@code actualWord} là dạng chuẩn hóa.
 * {@code homophone} là {@code true} khi lỗi {@code misspelled} thực ra là từ đồng âm (chỉ để hiển thị, không lưu).
 */
public record GradedWord(Integer position, String display, String expectedWord, String actualWord,
        WordClass wordClass, WordOutcome outcome, boolean homophone) {
}
