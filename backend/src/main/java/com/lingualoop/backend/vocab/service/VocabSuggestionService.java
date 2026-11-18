package com.lingualoop.backend.vocab.service;

import java.util.Optional;
import java.util.UUID;

import com.lingualoop.backend.vocab.dto.NewWordsSuggestion;

/** Gợi ý phần từ mới kế tiếp cho học viên không còn thẻ nào để ôn. */
public interface VocabSuggestionService {

    /**
     * Phần kế tiếp còn thẻ Mới của bộ học viên đang học (bộ họ chấm thẻ gần nhất); chưa học bộ nào thì phần đầu tiên của
     * bộ hệ thống đầu tiên. Rỗng khi không còn thẻ Mới nào để học.
     */
    Optional<NewWordsSuggestion> nextNewWords(UUID userId);
}
