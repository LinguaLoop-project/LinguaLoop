package com.lingualoop.backend.vocab.dto;

import java.util.UUID;

/**
 * Bộ thẻ thư viện chưa xóa kèm chủ hiện tại ({@code ownerId} null = bộ hệ thống chưa gán chủ), cho việc giao lại nội
 * dung (UC-QT-06, UC-QT-07).
 */
public record OwnedDeckView(UUID id, String name, UUID ownerId, String status) {

    /** Khớp CHECK của {@code vocab_decks.status} ('draft', 'published'). */
    public boolean published() {
        return "published".equals(status);
    }
}
