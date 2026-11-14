package com.lingualoop.backend.vocab.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.CreateDeckRequest;
import com.lingualoop.backend.vocab.dto.request.DeckListQuery;
import com.lingualoop.backend.vocab.dto.request.RestoreDeckRequest;
import com.lingualoop.backend.vocab.dto.request.UnpublishDeckRequest;
import com.lingualoop.backend.vocab.dto.request.UpdateDeckRequest;

/**
 * Quản lý bộ thẻ thư viện của giáo viên và quản trị viên (UC-BT-01 đến UC-BT-08). Trang đánh số từ 0: 10 bộ mỗi trang,
 * 20 thẻ mỗi trang. Quyền (BR-BT-01): giáo viên chỉ thao tác trên bộ của mình, bộ của người khác ném
 * {@code ForbiddenException}; bộ không tồn tại hoặc đã xóa ném {@code VOCAB_DECK_NOT_FOUND}.
 */
public interface VocabDeckManageService {

    /** Bộ của chính giáo viên theo bộ lọc; "Đã xóa" chỉ gồm bộ xóa trong 30 ngày gần nhất (BR-BT-01, 10, 12). */
    PageResponse<DeckManageView.Item> listForTeacher(UUID teacherId, DeckListQuery query, int page);

    /**
     * Bộ thư viện Đã xuất bản của mọi giáo viên và bộ hệ thống (BR-BT-01). Lọc trạng thái Nháp hoặc Đã xóa bị từ chối
     * với {@code ForbiddenException} (AC-BT-61).
     */
    PageResponse<DeckManageView.AdminItem> listForAdmin(DeckListQuery query, int page);

    /** Mọi danh mục theo thứ tự hiển thị, để giáo viên và quản trị viên chọn khi lọc hoặc tạo bộ (BR-BT-14). */
    List<DeckManageView.Category> listCategories();

    /**
     * Tạo bộ Nháp của giáo viên (BR-BT-02, 03, 13, 14). {@code request.imageKey()} trống = không có ảnh; có thì ảnh phải
     * đã được chính giáo viên tải lên S3. Tên trống hoặc dài quá, ảnh hoặc danh mục sai ném
     * {@code FieldValidationException}; trùng tên ném {@code ConflictException}. Lỗi thì ảnh vừa tải lên bị bỏ.
     */
    DeckManageView.Item createDeck(UUID teacherId, CreateDeckRequest request);

    /** Thông tin chung và nhóm thẻ của bộ chưa xóa do giáo viên tạo (UC-BT-04). */
    DeckManageView.Detail getForTeacher(UUID teacherId, UUID deckId);

    /**
     * Thông tin chung, chủ bộ và nhóm thẻ của bộ Đã xuất bản (UC-BT-04). Bộ Nháp ném {@code ForbiddenException}
     * (AC-BT-52); bộ đã xóa, bộ cá nhân ném {@code VOCAB_DECK_NOT_FOUND}.
     */
    DeckManageView.Detail getForAdmin(UUID deckId);

    /** Thẻ của một nhóm, 20 thẻ mỗi trang, tìm theo từ vựng (BR-BT-15); quyền như {@link #getForTeacher}. */
    PageResponse<DeckManageView.Card> listCardsForTeacher(UUID teacherId, UUID deckId, UUID groupId, String q,
            int page);

    /** Như {@link #listCardsForTeacher} cho quản trị viên; quyền như {@link #getForAdmin}. */
    PageResponse<DeckManageView.Card> listCardsForAdmin(UUID deckId, UUID groupId, String q, int page);

    /**
     * Sửa tên, ảnh, danh mục, yêu cầu Pro (UC-BT-03), cùng kiểm tra với {@link #createDeck}; giữ trạng thái và làm mới
     * ngày cập nhật. Ảnh cũ bị bỏ khỏi kho khi được thay hoặc xóa; lỗi thì ảnh mới vừa tải lên bị bỏ.
     */
    DeckManageView.Detail updateDeck(UUID teacherId, UUID deckId, UpdateDeckRequest request);

    /**
     * Xuất bản bộ Nháp (UC-BT-05). Bộ đã xuất bản ném {@code VOCAB_DECK_ALREADY_PUBLISHED}; bộ chưa đủ điều kiện
     * BR-BT-05 ném {@code VOCAB_DECK_NOT_PUBLISHABLE} kèm {@code details.noGroups} và {@code details.emptyGroups}.
     */
    void publish(UUID teacherId, UUID deckId);

    /** Giáo viên gỡ bộ của mình về Nháp, không cần lý do (UC-BT-06). Bộ Nháp ném {@code VOCAB_DECK_NOT_PUBLISHED}. */
    void unpublishByTeacher(UUID teacherId, UUID deckId);

    /**
     * Quản trị viên gỡ bộ Đã xuất bản bất kỳ về Nháp kèm lý do bắt buộc (UC-BT-06, BR-BT-08). Lý do trống ném
     * {@code FieldValidationException} trên trường {@code reason}; bộ Nháp ném {@code VOCAB_DECK_NOT_PUBLISHED}.
     */
    void unpublishByAdmin(UUID deckId, UnpublishDeckRequest request);

    /** Xóa tạm bộ Nháp hoặc Đã xuất bản của giáo viên, giữ 30 ngày (UC-BT-07, BR-BT-09, 10). */
    void deleteDeck(UUID teacherId, UUID deckId);

    /**
     * Khôi phục bộ đã xóa trong 30 ngày về Nháp (UC-BT-08). Bộ chưa xóa ném {@code VOCAB_DECK_NOT_DELETED}; quá hạn ném
     * {@code VOCAB_DECK_RESTORE_EXPIRED}; tên (cũ hoặc {@code request.name()}) trùng bộ khác ném
     * {@code VOCAB_DECK_NAME_TAKEN} để giáo viên nhập tên mới.
     */
    void restoreDeck(UUID teacherId, UUID deckId, RestoreDeckRequest request);
}
