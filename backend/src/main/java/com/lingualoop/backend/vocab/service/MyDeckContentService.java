package com.lingualoop.backend.vocab.service;

import java.util.UUID;

import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.vocab.dto.CardImportView;
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.CardRequest;
import com.lingualoop.backend.vocab.dto.request.GroupRequest;
import com.lingualoop.backend.vocab.service.VocabDeckContentService.TemplateFormat;

/**
 * Nhóm thẻ và thẻ trong bộ cá nhân của học viên (UC-HT-09, BR-HT-26). Dùng chung lõi với {@link VocabDeckContentService}
 * của giáo viên, khác ở ba điểm: chỉ học viên chủ bộ (học viên khác nhận {@code VOCAB_DECK_NOT_FOUND}, giáo viên và quản
 * trị viên nhận 403), không có luật xuất bản, và thẻ không có ảnh (yêu cầu kèm ảnh ném {@code FieldValidationException}
 * trên trường {@code image}).
 */
public interface MyDeckContentService {

    /** Thông tin chung và nhóm thẻ của bộ. */
    DeckManageView.Detail detail(UUID learnerId, UUID deckId);

    /** Thẻ của một nhóm, 20 thẻ mỗi trang, tìm theo từ vựng. */
    PageResponse<DeckManageView.Card> cards(UUID learnerId, UUID deckId, UUID groupId, String q, int page);

    DeckManageView.Group addGroup(UUID learnerId, UUID deckId, GroupRequest request);

    DeckManageView.Group renameGroup(UUID learnerId, UUID deckId, UUID groupId, GroupRequest request);

    /** Xóa tạm nhóm cùng mọi thẻ của nhóm; bộ được phép không còn nhóm nào. */
    void deleteGroup(UUID learnerId, UUID deckId, UUID groupId);

    DeckManageView.Card addCard(UUID learnerId, UUID deckId, UUID groupId, CardRequest request);

    DeckManageView.Card updateCard(UUID learnerId, UUID deckId, UUID groupId, UUID cardId, CardRequest request);

    void deleteCard(UUID learnerId, UUID deckId, UUID groupId, UUID cardId);

    /** Kiểm tệp Excel/CSV và trả số thẻ sẽ được thêm, chưa ghi gì (BR-NT-07). */
    CardImportView.Preview previewImport(UUID learnerId, UUID deckId, UUID groupId, String filename, byte[] content);

    /** Thêm mọi thẻ trong tệp vào cuối nhóm; có dòng lỗi thì không thêm thẻ nào. */
    CardImportView.Result importCards(UUID learnerId, UUID deckId, UUID groupId, String filename, byte[] content);

    /**
     * Thêm thẻ vào cuối nhóm từ một nghĩa của mục từ gốc trong từ điển (UC-HT-10, BR-HT-28). {@code sentenceId} có khi từ được
     * bấm trong một câu của bài học. Nghĩa không có ném {@code VOCAB_MEANING_NOT_FOUND}; từ đã có trong bộ ném
     * {@code VOCAB_CARD_WORD_TAKEN} kèm tên nhóm đang chứa.
     */
    DeckManageView.Card addFromDictionary(UUID learnerId, UUID deckId, UUID groupId, String headword, int meaningNo,
            UUID sentenceId);

    byte[] importTemplate(TemplateFormat format);
}
