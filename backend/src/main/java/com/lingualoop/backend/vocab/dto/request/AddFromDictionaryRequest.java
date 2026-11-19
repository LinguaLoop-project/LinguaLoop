package com.lingualoop.backend.vocab.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Thêm một thẻ vào bộ cá nhân từ một nghĩa của một mục từ gốc (UC-HT-10). {@code sentenceId} có khi từ được bấm trong một
 * câu của bài học: thẻ nhớ câu đó (BR-HT-28). Nội dung thẻ do máy chủ chép từ từ điển, không nhận từ client.
 */
public record AddFromDictionaryRequest(
        @NotBlank @Size(max = 64) String headword,
        @NotNull @Min(1) Integer meaningNo,
        UUID sentenceId) {
}
