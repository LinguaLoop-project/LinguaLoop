package com.lingualoop.backend.vocab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Thêm hoặc đổi tên nhóm thẻ (UC-NT-01, 02). Tên được cắt khoảng trắng hai đầu trước khi kiểm, nên tên chỉ có khoảng
 * trắng coi là trống và độ dài 1 đến 100 ký tự tính sau khi cắt (BR-NT-02).
 */
public record GroupRequest(@NotBlank @Size(max = 100) String name) {

    public GroupRequest {
        name = name == null ? null : name.strip();
    }
}
