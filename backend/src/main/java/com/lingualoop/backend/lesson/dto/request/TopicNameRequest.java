package com.lingualoop.backend.lesson.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Thêm hoặc sửa tên chủ đề (UC-CD-02, UC-CD-03). Tên 1 đến 100 ký tự sau khi bỏ khoảng trắng hai đầu (BR-CD-01). */
public record TopicNameRequest(@NotBlank @Size(max = 100) String name) {
}
