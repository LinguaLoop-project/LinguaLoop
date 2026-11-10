package com.lingualoop.backend.vocab.service;

import java.util.UUID;

import com.lingualoop.backend.vocab.dto.LearnView;
import com.lingualoop.backend.vocab.dto.request.AnswerRequest;

/** Học từ mới một phần: thẻ của phần, phiên học và ghi câu trả lời (UC-HT-02). */
public interface VocabLearnService {

    /**
     * Các thẻ của phần {@code partNumber} (tính từ 1, như đường dẫn) kèm tiến độ của học viên. 404 nếu bộ hoặc phần không
     * có; 403 nếu phần bị khoá với gói Free (BR-HT-07).
     */
    LearnView.PartDetail part(UUID userId, String slug, int partNumber);

    /** Mở phiên học mới cho phần này và đóng phiên còn mở trước đó (BR-HT-15). */
    LearnView.SessionRef openSession(UUID userId, String slug, int partNumber);

    /**
     * Ghi một câu trả lời và cập nhật thẻ theo BR-HT-10, BR-HT-11 và BR-HT-12. Gửi lại cùng {@code answerId} thì không ghi
     * lại và trả trạng thái hiện tại (BR-HT-16). 404 nếu phiên hoặc thẻ không thuộc học viên (BR-HT-06).
     */
    LearnView.AnswerResult answer(UUID userId, UUID sessionId, AnswerRequest request);
}
