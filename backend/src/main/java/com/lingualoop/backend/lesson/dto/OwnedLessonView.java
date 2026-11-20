package com.lingualoop.backend.lesson.dto;

import java.util.UUID;

import com.lingualoop.backend.lesson.enums.LessonStatus;

/** Bài học thư viện chưa xóa kèm chủ hiện tại, cho việc giao lại nội dung (UC-QT-06, UC-QT-07). */
public record OwnedLessonView(UUID id, String title, UUID ownerId, String status) {

    public boolean published() {
        return LessonStatus.PUBLISHED.value().equals(status);
    }
}
