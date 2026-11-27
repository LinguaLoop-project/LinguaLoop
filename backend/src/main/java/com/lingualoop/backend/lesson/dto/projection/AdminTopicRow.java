package com.lingualoop.backend.lesson.dto.projection;

import java.time.Instant;
import java.util.UUID;

/**
 * Một dòng danh sách chủ đề của quản trị viên, đọc bằng projection: chỉ lấy các cột cần hiển thị và đếm số bài đã xuất
 * bản ngay trong cùng truy vấn, không nạp entity bài học (UC-CD-01, BR-CD-05).
 */
public record AdminTopicRow(UUID id, String name, Long publishedLessons, Instant updatedAt) {
}
