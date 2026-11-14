package com.lingualoop.backend.vocab.dto.request;

/**
 * Yêu cầu khôi phục bộ (UC-BT-08). {@code name} trống = giữ tên cũ; chỉ cần gửi khi lần khôi phục trước báo
 * {@code VOCAB_DECK_NAME_TAKEN} (luồng 6a). Tên mới theo BR-BT-03.
 */
public record RestoreDeckRequest(String name) {
}
