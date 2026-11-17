package com.lingualoop.backend.report.service;

import java.util.UUID;

/**
 * Cho feature soạn nội dung ghi dấu "Bị quản trị viên gỡ" (BR-XL-13). Feature nội dung tự đưa bài học hoặc bộ thẻ về
 * Nháp rồi gọi các hàm này trong cùng transaction.
 */
public interface TakedownCommandService {

    /**
     * Quản trị viên gỡ tay bộ thẻ (UC-BT-06): gắn dấu với nguồn Gỡ tay, đóng báo cáo Phản cảm đang mở về thẻ của bộ,
     * lưu bản chụp, báo giáo viên chủ ({@code ownerId} {@code null} thì chỉ lưu) và ghi nhật ký.
     */
    void markDeckByAdmin(UUID adminId, UUID deckId, String deckName, UUID ownerId, String reason);

    /** Như {@link #markDeckByAdmin} cho bài học (UC-BH-07). */
    void markLessonByAdmin(UUID adminId, UUID lessonId, String lessonTitle, UUID ownerId, String reason);

    /** Giáo viên xóa bộ thẻ: hủy yêu cầu xuất bản lại đang chờ (nếu có), dấu giữ nguyên (UC-BT-07, BR-XL-13). */
    void cancelPendingForDeletedDeck(UUID deckId);

    /** Như {@link #cancelPendingForDeletedDeck} cho bài học (UC-BH-08). */
    void cancelPendingForDeletedLesson(UUID lessonId);
}
