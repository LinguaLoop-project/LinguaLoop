package com.lingualoop.backend.user.dto;

import java.time.Instant;
import java.util.UUID;

/** Dữ liệu màn giao lại nội dung (UC-QT-05, 06, 07). */
public final class ContentTransferView {

    private ContentTransferView() {
    }

    /**
     * Một bài học hoặc bộ thẻ cần giao. {@code type} là {@code lesson} hoặc {@code deck}; {@code ownerId} null (tên
     * "Hệ thống", {@code lockedAt} null) với bộ thẻ chưa gán chủ (BR-QT-05).
     */
    public record Item(String type, UUID id, String name, UUID ownerId, String ownerName, Instant lockedAt,
            long openReports) {
    }

    /** Một giáo viên đang giữ nội dung cần giao, cho bộ lọc theo giáo viên; {@code id} null = "Hệ thống". */
    public record Owner(UUID id, String name, Instant lockedAt, long itemCount) {
    }

    /** Giáo viên có thể nhận nội dung (BR-QT-06). */
    public record Recipient(UUID id, String displayName, String email) {
    }

    /** Tóm tắt nội dung thư viện của một giáo viên trước khi giao toàn bộ (UC-QT-07 Bước 2). */
    public record TeacherSummary(UUID teacherId, String displayName, String email, boolean locked, long lessons,
            long draftLessons, long decks, long draftDecks, long openReports) {
    }

    /** Mục bị trùng tên với nội dung cùng loại của giáo viên nhận (BR-QT-07). */
    public record Conflict(String type, UUID id, String name) {
    }

    /** Kết quả giao thành công. */
    public record Result(UUID recipientId, String recipientName, int lessons, int decks) {
    }
}
