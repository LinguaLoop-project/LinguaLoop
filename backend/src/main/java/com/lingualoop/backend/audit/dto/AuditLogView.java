package com.lingualoop.backend.audit.dto;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.common.response.PageResponse;

/** Dữ liệu trả về cho màn nhật ký của quản trị viên (UC-NK-01). */
public final class AuditLogView {

    private AuditLogView() {
    }

    /**
     * Một mục nhật ký trong danh sách. {@code actorId} trống là "Hệ thống"; {@code parentType}/{@code parentId} là đối
     * tượng chứa (bài học của câu, bộ thẻ của nhóm thẻ hoặc thẻ).
     */
    public record Row(
            long id,
            AuditAction action,
            AuditEntityType targetType,
            UUID targetId,
            String targetName,
            AuditEntityType parentType,
            UUID parentId,
            UUID actorId,
            String actorName,
            String actorRole,
            boolean hasChanges,
            Instant createdAt) {
    }

    /**
     * Chi tiết một mục (UC-NK-01 Bước 6): giá trị cũ và mới của từng mục bị đổi, lý do hoặc ghi chú (BR-NK-03).
     * {@code parentName} là tên hiện tại của bài học hoặc bộ thẻ chứa, rơi về tên đã lưu thì không còn; {@code open}
     * là trang quản trị mở được cho "Mở đối tượng" (BR-NK-17), trống khi đối tượng đã bị xóa.
     */
    public record Detail(Row entry, Map<String, Object> changes, String note, String parentName, Link open) {
    }

    /** Đối tượng để mở trang quản trị; {@code id} trống với cấu hình credit. */
    public record Link(AuditEntityType type, UUID id) {
    }
}
