package com.lingualoop.backend.vocab.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Lưu một nghĩa của một mục từ gốc. {@code sentenceId} có khi từ được bấm trong một câu của bài học. Dạng chia
 * ("went") bị từ chối: giao diện lưu nghĩa của từ gốc ("go") ở phần nghĩa của từ gốc.
 */
public record SaveWordRequest(
        @NotBlank @Size(max = 64) String headword,
        @NotNull @Min(1) Integer meaningNo,
        UUID sentenceId) {
}
