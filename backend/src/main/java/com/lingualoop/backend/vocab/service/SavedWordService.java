package com.lingualoop.backend.vocab.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.vocab.dto.SavedWordView;

/** Từ đã lưu của học viên (UC-HT-06, UC-HT-07). */
public interface SavedWordService {

    /** Mọi từ đã lưu, mới lưu trước. */
    List<SavedWordView> list(UUID userId);

    /**
     * Lưu một nghĩa; lưu lại nghĩa đã lưu thì trả bản hiện có, không lỗi (BR-HT-01). Lưu lại nghĩa đã bỏ lưu thì
     * khôi phục thẻ cùng tiến độ cũ (BR-HT-04).
     */
    SavedWordView save(UUID userId, String headword, int meaningNo, UUID sentenceId);

    /** Bỏ lưu: xoá dòng từ đã lưu và ẩn thẻ. 404 nếu không phải từ đã lưu của học viên này (BR-HT-06). */
    void unsave(UUID userId, UUID savedWordId);
}
