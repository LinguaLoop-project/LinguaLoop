package com.lingualoop.backend.vocab.service;

import java.util.UUID;

/**
 * Gỡ và xuất bản lại bộ thẻ thư viện theo quyết định xử lý báo cáo (UC-XL-04, UC-XL-05). Chỉ feature {@code report}
 * gọi; quyền do feature đó kiểm.
 */
public interface DeckModerationService {

    /**
     * Đưa bộ thư viện Đã xuất bản về Nháp kèm lý do gỡ hiện cho giáo viên chủ (BR-XL-13). Bộ đã là Nháp hoặc đã xóa thì
     * không đổi gì (UC-XL-04 nhánh 2a).
     */
    void unpublishForReport(UUID deckId, String reason);

    /**
     * Xuất bản bộ sau khi quản trị viên duyệt (UC-XL-05). Bộ không tồn tại hoặc đã xóa ném {@code VOCAB_DECK_NOT_FOUND};
     * chưa đạt BR-BT-05 ném {@code VOCAB_DECK_NOT_PUBLISHABLE} như khi giáo viên xuất bản.
     */
    void publishApproved(UUID deckId);
}
