package com.lingualoop.backend.vocab.service;

import java.util.Optional;
import java.util.UUID;

import com.lingualoop.backend.vocab.dto.NewWordsSuggestion;

/** Phần từ mới kế tiếp cho học viên: gợi ý ở trang Hôm nay và nguồn từ mới của khung bài ngày (BR-HT-29, BR-HT-32). */
public interface VocabSuggestionService {

    /**
     * Phần kế tiếp còn thẻ Mới của bộ học viên đang học (bộ họ chấm thẻ gần nhất). Chưa học bộ nào thì chọn bộ khởi đầu
     * theo cấp độ (BR-HT-32): bộ cùng {@code currentLevel}, không có thì bộ gần nhất ở dưới, rồi gần nhất ở trên, cuối cùng
     * bộ chưa gắn cấp độ; cùng mức thì bộ hệ thống trước. Rỗng khi không còn thẻ Mới nào để học.
     *
     * @param currentLevel cấp độ hiện tại của học viên (A1 đến C2); trống hoặc không hợp lệ thì coi là A1
     */
    Optional<NewWordsSuggestion> nextNewWords(UUID userId, String currentLevel);
}
