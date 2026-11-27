package com.lingualoop.backend.lesson.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.lesson.dto.projection.AdminTopicRow;

/**
 * Chủ đề trong danh sách quản trị (UC-CD-01). {@code visible}: Đang hiển thị khi có ít nhất 1 bài học đã xuất bản,
 * ngược lại Chưa hiển thị (BR-CD-04).
 */
public record AdminTopicResponse(UUID id, String name, long publishedLessons, boolean visible, Instant updatedAt) {

    public static AdminTopicResponse from(AdminTopicRow row) {
        long published = row.publishedLessons() == null ? 0 : row.publishedLessons();
        return new AdminTopicResponse(row.id(), row.name(), published, published > 0, row.updatedAt());
    }
}
