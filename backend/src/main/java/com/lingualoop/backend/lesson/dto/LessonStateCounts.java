package com.lingualoop.backend.lesson.dto;

/** Số bài học viên đang học và đã hoàn thành, theo cùng luật {@code LessonState} của thư viện bài (BR-TH-04). */
public record LessonStateCounts(long doing, long done) {
}
