package com.lingualoop.backend.dictionary.dto;

import java.util.UUID;

/**
 * Một nghĩa của một mục từ, đủ nội dung để chép vào thẻ (ADR 0009). Đường dẫn âm thanh để nguyên dạng tương đối
 * như trong từ điển; đổi sang URL bằng {@code DictionaryQueryService#resolveAudioUrl} khi hiển thị.
 */
public record MeaningSnapshot(
        UUID wordId,
        String headword,
        String pos,
        int meaningNo,
        String meaningVi,
        String definitionEn,
        String definitionVi,
        String exampleEn,
        String exampleVi,
        String ipaUk,
        String ipaUs,
        String audioUk,
        String audioUs) {
}
