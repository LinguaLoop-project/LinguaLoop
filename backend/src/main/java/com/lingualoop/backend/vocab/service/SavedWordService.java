package com.lingualoop.backend.vocab.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.vocab.dto.SavedWordView;

/** Từ đã lưu của học viên (UC-VOCAB-01, UC-VOCAB-02). */
public interface SavedWordService {

    /** Mọi từ đã lưu, mới lưu trước. */
    List<SavedWordView> list(UUID userId);

    /**
     * Lưu một nghĩa; lưu lại nghĩa đã lưu thì trả bản hiện có, không lỗi (BR-VOCAB-01). Lưu lại nghĩa đã bỏ lưu thì
     * khôi phục thẻ cùng tiến độ cũ (BR-VOCAB-03).
     */
    SavedWordView save(UUID userId, String headword, int meaningNo, UUID sentenceId);

    /** Bỏ lưu: xoá dòng từ đã lưu và ẩn thẻ. 404 nếu không phải từ đã lưu của học viên này (BR-VOCAB-13). */
    void unsave(UUID userId, UUID savedWordId);
}
