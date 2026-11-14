package com.lingualoop.backend.vocab.dto.request;

import java.util.UUID;

/**
 * Yêu cầu tạo bộ (JSON). Tên được kiểm ở service vì độ dài tính sau khi cắt khoảng trắng hai đầu (BR-BT-03).
 * {@code categoryId} trống = không danh mục; {@code pro} không gửi = không yêu cầu gói Pro (BR-BT-06). {@code pro} là
 * {@code Boolean} vì Jackson 3 từ chối trường primitive bị thiếu. {@code imageKey} là key S3 nhận từ
 * {@code POST /api/v1/uploads/presign} (mục đích {@code DECK_IMAGE}) sau khi đã tải ảnh lên; trống = ảnh mặc định.
 */
public record CreateDeckRequest(String name, UUID categoryId, Boolean pro, String imageKey) {

    public CreateDeckRequest {
        pro = Boolean.TRUE.equals(pro);
        imageKey = imageKey == null || imageKey.isBlank() ? null : imageKey.strip();
    }
}
