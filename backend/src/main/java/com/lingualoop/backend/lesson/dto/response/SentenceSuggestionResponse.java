package com.lingualoop.backend.lesson.dto.response;

import java.util.List;
import java.util.UUID;

/**
 * Gợi ý để màn Sửa câu điền vào ô, chưa lưu (UC-BH-10 Bước 5). Ô không được gợi ý là {@code null}.
 *
 * @param translationOutcome {@code COMPLETE}, {@code AI_FAILED}, hoặc {@code null} khi không yêu cầu bản dịch
 */
public record SentenceSuggestionResponse(
        List<Item> sentences,
        int translatedCount,
        int ipaCount,
        String translationOutcome) {

    public SentenceSuggestionResponse {
        sentences = List.copyOf(sentences);
    }

    public record Item(UUID id, String textVi, String ipaUs, String ipaUk) {
    }
}
