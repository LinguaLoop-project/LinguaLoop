package com.lingualoop.backend.practice.dto;

/**
 * Số câu khác nhau học viên đã luyện trong một khoảng, tổng và theo từng chế độ. Câu luyện ở cả hai chế độ tính một lần
 * ở {@code total} và một lần ở mỗi chế độ (BR-TH-04).
 */
public record SentenceCountsView(long total, long dictation, long shadowing) {
}
