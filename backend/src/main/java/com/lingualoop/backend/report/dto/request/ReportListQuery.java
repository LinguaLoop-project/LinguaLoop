package com.lingualoop.backend.report.dto.request;

import java.util.UUID;

import com.lingualoop.backend.report.enums.ReportReason;
import com.lingualoop.backend.report.enums.ReportStatus;
import com.lingualoop.backend.report.enums.ReportTargetType;

/**
 * Bộ lọc danh sách báo cáo (BR-XL-03). {@code status} null nghĩa là mọi trạng thái. Ba bộ lọc cuối chỉ quản trị viên
 * dùng: theo giáo viên chủ, theo học viên đã báo, "Không có giáo viên xử lý" và "Học viên có nhiều báo cáo bị từ chối".
 */
public record ReportListQuery(
        ReportStatus status,
        ReportTargetType targetType,
        ReportReason reason,
        boolean overdue,
        String q,
        boolean oldestFirst,
        UUID ownerId,
        UUID reporterId,
        boolean noHandler,
        boolean frequentRejected) {

    /** Bộ lọc của giáo viên: bỏ các bộ lọc chỉ dành cho quản trị viên. */
    public ReportListQuery forTeacher() {
        return new ReportListQuery(status, targetType, reason, overdue, q, oldestFirst, null, null, false, false);
    }
}
