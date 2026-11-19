package com.lingualoop.backend.vocab.service;

import java.util.List;
import java.util.UUID;

import com.lingualoop.backend.vocab.dto.MyDeckView;

/**
 * Quản lý bộ từ vựng cá nhân của học viên, "Bộ của tôi" (UC-HT-08). Chỉ học viên dùng được; bộ không có, đã xóa, của
 * người khác hoặc không phải bộ cá nhân đều báo {@code VOCAB_DECK_NOT_FOUND} (BR-HT-06).
 */
public interface MyDeckService {

    /** Bộ cá nhân chưa xóa của học viên, mới tạo trước. */
    List<MyDeckView> list(UUID userId);

    /**
     * Thêm bộ trống. Tên được cắt khoảng trắng hai đầu, dài 1 đến 100 ký tự (lỗi trên trường {@code name}) và không
     * trùng tên bộ khác của học viên, không phân biệt hoa thường (409, BR-HT-25).
     */
    MyDeckView create(UUID userId, String name);

    /** Đổi tên theo cùng quy tắc như {@link #create}; đặt lại đúng tên hiện tại không phải lỗi trùng. */
    MyDeckView rename(UUID userId, UUID deckId, String name);

    /** Xóa tạm bộ: bộ biến khỏi danh sách và các thẻ của bộ không còn vào hàng đợi ôn; tên được dùng lại cho bộ mới. */
    void delete(UUID userId, UUID deckId);
}
