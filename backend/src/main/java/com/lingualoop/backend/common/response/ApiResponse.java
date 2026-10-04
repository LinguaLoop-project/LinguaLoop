package com.lingualoop.backend.common.response;

import java.time.Instant;

/**
 * Vỏ bọc chung cho mọi response thành công. Không có trường message: câu hiển thị do
 * frontend dịch. Kết quả nghiệp vụ cần phân biệt thì đặt thành field enum trong {@code data}.
 * Response lỗi dùng {@link com.lingualoop.backend.common.exception.ErrorResponse}.
 */
public record ApiResponse<T>(boolean success, T data, Instant timestamp) {

    public static <T> ApiResponse<T> ok(T data) {
        return new ApiResponse<>(true, data, Instant.now());
    }
}
