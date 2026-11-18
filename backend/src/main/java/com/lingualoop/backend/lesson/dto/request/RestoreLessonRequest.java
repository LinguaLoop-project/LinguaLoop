package com.lingualoop.backend.lesson.dto.request;

/** Tiêu đề mới khi khôi phục bài mà tiêu đề cũ đã trùng bài khác (UC-BH-09 luồng 6a); trống = giữ tiêu đề cũ. */
public record RestoreLessonRequest(String title) {
}
