package com.lingualoop.backend.vocab.service;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.storage.service.FileStorageService;

import lombok.RequiredArgsConstructor;

/**
 * Ảnh minh họa của bộ. Cột {@code vocab_decks.image_url} lưu S3 key (thư mục {@code vocab-decks/} đọc công khai) nên
 * ghép với gốc URL của kho tệp; dữ liệu cũ đã là URL đầy đủ thì dùng nguyên.
 */
@Component
@RequiredArgsConstructor
class DeckImageUrls {

    private final FileStorageService storage;

    String resolve(String stored) {
        if (stored == null || stored.isBlank()) {
            return null;
        }
        return stored.regionMatches(true, 0, "http://", 0, 7) || stored.regionMatches(true, 0, "https://", 0, 8)
                ? stored
                : storage.publicUrl(stored);
    }
}
