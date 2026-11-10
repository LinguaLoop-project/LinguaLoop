package com.lingualoop.backend.vocab.dto;

import java.time.Instant;
import java.util.UUID;

import com.lingualoop.backend.vocab.enums.CardStatus;
import com.lingualoop.backend.vocab.enums.SavedWordSource;

/**
 * Một từ đã lưu: nội dung thẻ, nguồn và trạng thái. {@code due} cho biết thẻ đến hạn ôn ngay bây giờ (BR-HT-13);
 * thẻ Mới của bộ "Từ đã lưu" đến hạn ngay vì bộ này không có bước học từ mới. {@code lesson} chỉ có khi từ lưu từ bài
 * học và bài đó còn xem được.
 */
public record SavedWordView(
        UUID id,
        String headword,
        String cefrLevel,
        String pos,
        Integer meaningNo,
        String translationVi,
        String exampleEn,
        String exampleVi,
        String ipaUk,
        String ipaUs,
        String audioUk,
        String audioUs,
        SavedWordSource source,
        Lesson lesson,
        String contextEn,
        String contextVi,
        CardStatus status,
        Instant nextReviewAt,
        boolean due,
        Instant savedAt) {

    public record Lesson(String slug, String title, UUID sentenceId) {
    }
}
