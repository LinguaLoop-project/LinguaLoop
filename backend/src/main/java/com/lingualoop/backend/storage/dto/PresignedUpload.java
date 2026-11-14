package com.lingualoop.backend.storage.dto;

import java.time.Instant;
import java.util.Map;

/**
 * URL tải lên đã ký. Client gửi {@code method} tới {@code uploadUrl}, thân là nội dung tệp, kèm đúng {@code headers}
 * (khác giá trị thì S3 trả 403). {@code key} gửi lại cho backend sau khi tải xong.
 */
public record PresignedUpload(String key, String uploadUrl, String method, Map<String, String> headers,
        Instant expiresAt) {

    public PresignedUpload {
        headers = headers == null ? Map.of() : Map.copyOf(headers);
    }
}
