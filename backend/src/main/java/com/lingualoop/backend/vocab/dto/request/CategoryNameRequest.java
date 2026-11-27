package com.lingualoop.backend.vocab.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Thêm hoặc sửa tên danh mục (UC-CD-05, UC-CD-06). Tên 1 đến 100 ký tự sau khi bỏ khoảng trắng hai đầu (BR-CD-02). */
public record CategoryNameRequest(@NotBlank @Size(max = 100) String name) {
}
