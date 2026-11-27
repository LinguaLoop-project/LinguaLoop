package com.lingualoop.backend.vocab.dto.projection;

import java.time.Instant;
import java.util.UUID;

/**
 * Một dòng danh sách danh mục của quản trị viên, đọc bằng projection: chỉ lấy các cột cần hiển thị và đếm số bộ thẻ
 * đã xuất bản ngay trong cùng truy vấn, không nạp entity bộ thẻ (UC-CD-04, BR-CD-06).
 */
public record AdminCategoryRow(UUID id, String name, Long publishedDecks, Instant updatedAt) {
}
