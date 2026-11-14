package com.lingualoop.backend.storage.dto;

import com.lingualoop.backend.storage.service.UploadPurpose;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/** Xin URL tải lên: mục đích, Content-Type và dung lượng (byte) của tệp client sắp gửi. */
public record PresignUploadRequest(
        @NotNull UploadPurpose purpose,
        @NotBlank String contentType,
        @NotNull @Positive Long size) {
}
