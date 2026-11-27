package com.lingualoop.backend.user.dto.request;

import jakarta.validation.constraints.NotBlank;

/** Khóa tệp ảnh đại diện đã tải lên S3 bằng {@code POST /uploads/presign} (mục đích {@code AVATAR}). */
public record AvatarRequest(@NotBlank String key) {
}
