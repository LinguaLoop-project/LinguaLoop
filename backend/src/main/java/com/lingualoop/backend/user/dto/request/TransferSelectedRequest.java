package com.lingualoop.backend.user.dto.request;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.user.enums.TransferContentType;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Giao các mục đã chọn cho một giáo viên (UC-QT-06). Mỗi mục kèm chủ mà quản trị viên đã thấy ({@code ownerId} null =
 * bộ hệ thống) để phát hiện mục vừa đổi chủ (nhánh 7c).
 */
public record TransferSelectedRequest(
        @NotNull UUID recipientId,
        @NotNull @Size(max = 200) List<@Valid @NotNull Item> items) {

    public record Item(
            @NotNull @Pattern(regexp = "lesson|deck") String type,
            @NotNull UUID id,
            UUID ownerId) {

        /** Gọi sau khi request đã qua kiểm tra hợp lệ. */
        public TransferContentType contentType() {
            return TransferContentType.fromValue(type);
        }
    }
}
