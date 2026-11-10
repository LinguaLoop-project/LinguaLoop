package com.lingualoop.backend.vocab.service;

import java.util.UUID;

import com.lingualoop.backend.vocab.dto.DeckView;

/** Danh sách bộ và chi tiết một bộ cho học viên (UC-HT-01). */
public interface VocabDeckService {

    /** Bộ hệ thống kèm tiến độ của học viên, và số thẻ theo trạng thái trên mọi bộ kể cả "Từ đã lưu". */
    DeckView.ListResult list(UUID userId);

    /** Một bộ hệ thống; 404 nếu không có, đã ẩn, hoặc là bộ "Từ đã lưu" hay bộ của người khác (BR-HT-06). */
    DeckView.Detail detail(UUID userId, String slug);
}
