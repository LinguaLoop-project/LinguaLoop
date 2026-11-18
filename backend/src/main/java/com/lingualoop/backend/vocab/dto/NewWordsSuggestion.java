package com.lingualoop.backend.vocab.dto;

import java.util.UUID;

/**
 * Gợi ý học từ mới cho người học không còn gì để ôn: phần kế tiếp còn thẻ Mới. {@code partNumber} tính từ 1 và khớp
 * đường dẫn {@code /vocab/{deckId}/parts/{part}}. {@code newCards} là số thẻ của một lượt học (tối đa 10, BR-HT-19);
 * {@code continuing} là true khi bộ này người học đã bắt đầu học, false khi là bộ gợi ý mở đầu.
 */
public record NewWordsSuggestion(UUID deckId, String deckName, int partNumber, String partName, int newCards,
        boolean continuing) {
}
