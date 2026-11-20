package com.lingualoop.backend.lesson.dto.request;

/** Lý do quản trị viên gỡ xuất bản (BR-BH-04): bắt buộc, 1 đến 500 ký tự sau khi cắt khoảng trắng; kiểm ở service. */
public record UnpublishLessonRequest(String reason) {
}
