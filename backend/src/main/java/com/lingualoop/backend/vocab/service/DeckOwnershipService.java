package com.lingualoop.backend.vocab.service;

import java.util.Collection;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import com.lingualoop.backend.vocab.dto.OwnedDeckView;

/**
 * Đổi chủ bộ thẻ thư viện khi quản trị viên giao lại nội dung (UC-QT-06, UC-QT-07, BR-QT-07). Chỉ feature {@code user}
 * gọi, trong giao dịch của nó; quyền do feature đó kiểm. Bộ cá nhân, bộ Từ đã lưu và bộ đã xóa không bao giờ được giao.
 */
public interface DeckOwnershipService {

    /** Khóa và trả các bộ thư viện chưa xóa trong {@code ids} (kể cả bộ hệ thống chưa gán chủ). */
    List<OwnedDeckView> lockLibraryDecks(Collection<UUID> ids);

    /** Khóa và trả mọi bộ thư viện chưa xóa (Nháp và Đã xuất bản) của giáo viên. */
    List<OwnedDeckView> lockLibraryDecksOf(UUID ownerId);

    /** Tên chữ thường của mọi bộ chưa xóa của người dùng, để kiểm trùng tên (BR-QT-07, BR-BT-03). */
    Set<String> activeNamesLower(UUID ownerId);

    /** Đổi chủ các bộ; giữ nguyên trạng thái, nhóm thẻ, thẻ và tiến độ học. Trả số bộ đã đổi. */
    int changeOwner(Collection<UUID> deckIds, UUID newOwnerId);
}
