package com.lingualoop.backend.practice.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.lingualoop.backend.practice.dto.SentenceNoteEntryView;
import com.lingualoop.backend.practice.dto.SentenceNoteView;

public interface SentenceNoteService {

    /** Ghi chú của người dùng cho câu; rỗng nếu chưa có. */
    Optional<SentenceNoteView> find(UUID userId, UUID sentenceId);

    /** Nội dung ghi chú theo câu trong một bài. */
    Map<UUID, String> findContentsByLesson(UUID userId, UUID lessonId);

    /** Tạo hoặc thay nội dung ghi chú; chỉ ghi chú được câu đã có lượt nghe chép. */
    SentenceNoteView save(UUID userId, UUID sentenceId, String content);

    /** Xoá ghi chú; không có ghi chú thì không làm gì. */
    void delete(UUID userId, UUID sentenceId);

    /** Mọi ghi chú của người dùng, mới sửa trước; lọc theo bài khi truyền slug. */
    List<SentenceNoteEntryView> list(UUID userId, String lessonSlug);
}
