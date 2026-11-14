package com.lingualoop.backend.vocab.dto.request;

import java.util.UUID;

/**
 * Điều kiện tìm và lọc danh sách bộ (UC-BT-01 bước 5). {@code other} = chỉ bộ không danh mục (mục "Khác"),
 * {@code pro} = chỉ bộ yêu cầu gói Pro. {@code status} dùng cho giáo viên; {@code ownerId} và {@code system} (chỉ bộ
 * hệ thống, không có chủ) dùng cho quản trị viên.
 */
public record DeckListQuery(
        String q,
        UUID categoryId,
        boolean other,
        boolean pro,
        DeckStatusFilter status,
        UUID ownerId,
        boolean system) {

    public DeckListQuery {
        status = status == null ? DeckStatusFilter.ALL : status;
    }
}
