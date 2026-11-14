package com.lingualoop.backend.vocab.service;

import java.util.UUID;

import com.lingualoop.backend.vocab.dto.CardImagesView;
import com.lingualoop.backend.vocab.dto.CardImportView;
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.AttachCardImagesRequest;
import com.lingualoop.backend.vocab.dto.request.CardRequest;
import com.lingualoop.backend.vocab.dto.request.GroupRequest;

/**
 * Nhóm thẻ và thẻ của bộ thư viện do giáo viên quản lý (UC-NT-01 đến UC-NT-07). Quyền (BR-NT-01): chỉ giáo viên chủ
 * bộ; bộ của người khác ném {@code ForbiddenException}; bộ không tồn tại, đã xóa hoặc không phải bộ thư viện ném
 * {@code VOCAB_DECK_NOT_FOUND}; nhóm hoặc thẻ không còn ném {@code VOCAB_GROUP_NOT_FOUND}, {@code VOCAB_CARD_NOT_FOUND}.
 * Thao tác làm bộ Đã xuất bản không còn đủ điều kiện xuất bản ném {@code VOCAB_DECK_MUST_STAY_PUBLISHABLE} kèm
 * {@code details.reason} là {@code EMPTY_GROUP}, {@code LAST_GROUP} hoặc {@code LAST_CARD} (BR-NT-05). Mọi thay đổi
 * làm mới thời điểm cập nhật của bộ (BR-NT-06). Nội dung yêu cầu đã được kiểm bằng Bean Validation ở controller.
 */
public interface VocabDeckContentService {

    /** Thêm nhóm trống vào cuối bộ Nháp (UC-NT-01). Trùng tên ném {@code VOCAB_GROUP_NAME_TAKEN} (BR-NT-02). */
    DeckManageView.Group addGroup(UUID teacherId, UUID deckId, GroupRequest request);

    /** Đổi tên nhóm, được cả khi bộ Đã xuất bản (UC-NT-02). Trùng tên nhóm khác ném {@code VOCAB_GROUP_NAME_TAKEN}. */
    DeckManageView.Group renameGroup(UUID teacherId, UUID deckId, UUID groupId, GroupRequest request);

    /** Xóa tạm nhóm cùng mọi thẻ của nhóm (UC-NT-03, BR-NT-04). */
    void deleteGroup(UUID teacherId, UUID deckId, UUID groupId);

    /**
     * Thêm thẻ vào cuối nhóm (UC-NT-04). Có {@code imageKey} thì ảnh phải đã được chính giáo viên tải lên (mục đích
     * {@code CARD_IMAGE}) và là JPG/PNG thật, sai ném {@code FieldValidationException} trên trường {@code image}. Từ
     * đã có ở thẻ khác trong bộ ném {@code VOCAB_CARD_WORD_TAKEN} kèm {@code details} {@code cardId}, {@code groupId},
     * {@code groupName}, {@code word} của thẻ đã có (BR-BT-04).
     */
    DeckManageView.Card addCard(UUID teacherId, UUID deckId, UUID groupId, CardRequest request);

    /**
     * Sửa thẻ, giữ vị trí trong nhóm (UC-NT-05); kiểm trùng như {@link #addCard}, bỏ qua chính thẻ này. Ảnh:
     * {@code imageKey} = thay ảnh, {@code removeImage} = bỏ ảnh, cả hai trống = giữ ảnh; ảnh cũ bị xóa khỏi kho sau khi
     * lưu.
     */
    DeckManageView.Card updateCard(UUID teacherId, UUID deckId, UUID groupId, UUID cardId, CardRequest request);

    /** Xóa tạm thẻ (UC-NT-06, BR-NT-04). */
    void deleteCard(UUID teacherId, UUID deckId, UUID groupId, UUID cardId);

    /**
     * Kiểm tệp Excel/CSV và trả số thẻ sẽ được thêm, chưa ghi gì (UC-NT-07 bước 7). Lỗi tệp ném
     * {@code VOCAB_IMPORT_FILE_INVALID} ({@code details.reason}: {@code FORMAT}, {@code TOO_LARGE},
     * {@code MISSING_COLUMNS}, {@code EMPTY}); quá 500 dòng ném {@code VOCAB_IMPORT_TOO_MANY_ROWS}; dòng sai ném
     * {@code VOCAB_IMPORT_ROWS_INVALID} với {@code details.errors} là danh sách {@code row}, {@code field},
     * {@code code} (BR-NT-07).
     */
    CardImportView.Preview previewImport(UUID teacherId, UUID deckId, UUID groupId, String filename, byte[] content);

    /** Kiểm lại như {@link #previewImport} rồi thêm mọi thẻ vào cuối nhóm theo thứ tự dòng; lỗi thì không thêm thẻ nào. */
    CardImportView.Result importCards(UUID teacherId, UUID deckId, UUID groupId, String filename, byte[] content);

    /** Gắn ảnh hàng loạt cho thẻ của nhóm, ghép theo tên tệp với từ vựng (UC-NT-08, BR-NT-09). */
    CardImagesView.Result attachImages(UUID teacherId, UUID deckId, UUID groupId, AttachCardImagesRequest request);

    /** Tệp mẫu nhập thẻ (AC-NT-49). */
    byte[] importTemplate(TemplateFormat format);

    enum TemplateFormat {
        XLSX, CSV
    }
}
