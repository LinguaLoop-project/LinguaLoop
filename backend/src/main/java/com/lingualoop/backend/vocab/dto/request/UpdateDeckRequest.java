package com.lingualoop.backend.vocab.dto.request;

import java.util.UUID;

/**
 * Yêu cầu sửa bộ (UC-BT-03), cùng quy tắc với {@link CreateDeckRequest}. Ảnh: {@code imageKey} có = thay bằng ảnh mới
 * vừa tải lên S3; {@code removeImage = true} = về ảnh mặc định (luồng 3a); cả hai trống = giữ ảnh hiện tại.
 */
public record UpdateDeckRequest(String name, UUID categoryId, Boolean pro, String imageKey, Boolean removeImage) {

    public UpdateDeckRequest {
        pro = Boolean.TRUE.equals(pro);
        removeImage = Boolean.TRUE.equals(removeImage);
        imageKey = imageKey == null || imageKey.isBlank() ? null : imageKey.strip();
    }
}
