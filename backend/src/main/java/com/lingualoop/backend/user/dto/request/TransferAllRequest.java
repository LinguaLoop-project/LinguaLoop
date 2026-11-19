package com.lingualoop.backend.user.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Giao toàn bộ nội dung thư viện của một giáo viên (UC-QT-07). Số bài học và số bộ thẻ trong tóm tắt quản trị viên đã
 * thấy, để phát hiện nội dung vừa thay đổi (nhánh 7c).
 */
public record TransferAllRequest(
        @NotNull UUID recipientId,
        @Min(0) long expectedLessons,
        @Min(0) long expectedDecks) {
}
