package com.lingualoop.backend.practice.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.SentenceNoteEntryView;
import com.lingualoop.backend.practice.dto.SentenceNoteView;

/** Ghi chú của người học; mỗi chế độ (nghe chép, Shadowing) có ghi chú riêng cho cùng một câu. */
public interface SentenceNoteService {

    /** Ghi chú của người dùng cho câu ở một chế độ; rỗng nếu chưa có. */
    Optional<SentenceNoteView> find(UUID userId, UUID sentenceId, PracticeMode mode);

    /** Nội dung ghi chú theo câu trong một bài, ở một chế độ. */
    Map<UUID, String> findContentsByLesson(UUID userId, UUID lessonId, PracticeMode mode);

    /** Tạo hoặc thay nội dung ghi chú; chỉ ghi chú được câu đã có lượt ở chính chế độ đó. */
    SentenceNoteView save(UUID userId, UUID sentenceId, PracticeMode mode, String content);

    /** Xoá ghi chú; không có ghi chú thì không làm gì. */
    void delete(UUID userId, UUID sentenceId, PracticeMode mode);

    /** Mọi ghi chú của người dùng, mới sửa trước; {@code mode} null là cả hai chế độ, {@code lessonSlug} null là mọi bài. */
    List<SentenceNoteEntryView> list(UUID userId, PracticeMode mode, String lessonSlug);
}
