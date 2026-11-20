package com.lingualoop.backend.lesson.dto.request;

import java.util.List;
import java.util.UUID;

/**
 * Một lần "Lưu" các câu (UC-BH-05). {@code sentences} là các câu có thay đổi (gửi cả câu không đổi cũng được);
 * {@code deletedIds} là các câu giáo viên đã chọn "Xóa"; {@code added} là các câu mới sinh ra khi tách câu, chỉ được khi
 * bài chưa từng xuất bản (BR-BH-13). Gộp hai câu là sửa một câu và xóa câu kia. Mọi thay đổi lưu cùng lúc hoặc không lưu
 * gì.
 */
public record UpdateSentencesRequest(List<SentenceEdit> sentences, List<UUID> deletedIds, List<NewSentence> added) {

    public UpdateSentencesRequest {
        sentences = sentences == null ? List.of() : List.copyOf(sentences);
        deletedIds = deletedIds == null ? List.of() : List.copyOf(deletedIds);
        added = added == null ? List.of() : List.copyOf(added);
    }

    /** Nội dung mới của một câu (BR-BH-09); {@code ipaUs}, {@code ipaUk}, {@code textVi} trống = để trống. */
    public record SentenceEdit(UUID id, String textEn, String ipaUs, String ipaUk, String textVi, Integer startMs,
            Integer endMs) {
    }

    /**
     * Câu mới. {@code key} do trình duyệt đặt, chỉ để trả lỗi về đúng câu ({@code details.errors[].sentenceId}).
     */
    public record NewSentence(String key, String textEn, String ipaUs, String ipaUk, String textVi, Integer startMs,
            Integer endMs) {
    }
}
