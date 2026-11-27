package com.lingualoop.backend.vocab.dto.response;

import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.vocab.dto.projection.AdminCategoryRow;

/** Danh mục trong danh sách quản trị (UC-CD-04): số bộ thẻ là số bộ đã xuất bản thuộc danh mục (BR-CD-06). */
public record AdminCategoryResponse(UUID id, String name, long publishedDecks, Instant updatedAt) {

    public static AdminCategoryResponse from(AdminCategoryRow row) {
        return new AdminCategoryResponse(row.id(), row.name(),
                row.publishedDecks() == null ? 0 : row.publishedDecks(), row.updatedAt());
    }
}
