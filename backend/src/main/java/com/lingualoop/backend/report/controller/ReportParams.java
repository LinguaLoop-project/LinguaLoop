package com.lingualoop.backend.report.controller;

import java.util.UUID;

import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.report.dto.request.ReportListQuery;
import com.lingualoop.backend.report.enums.ReportReason;
import com.lingualoop.backend.report.enums.ReportStatus;
import com.lingualoop.backend.report.enums.ReportTargetType;

/** Đọc tham số lọc của danh sách báo cáo từ query string; giá trị sai ném {@code FieldValidationException}. */
final class ReportParams {

    static final String ALL = "all";
    static final String OLDEST = "oldest";

    private ReportParams() {
    }

    /**
     * {@code status} vắng thì dùng {@code defaultStatus} (lọc sẵn báo cáo đang chờ tác nhân, BR-XL-03); {@code all} là
     * mọi trạng thái. {@code sort}: {@code newest} (mặc định) hoặc {@code oldest} ("Chờ lâu nhất").
     */
    static ReportListQuery query(String status, ReportStatus defaultStatus, String type, String reason,
            boolean overdue, String q, String sort, UUID ownerId, UUID reporterId, boolean noHandler,
            boolean frequentRejected) {
        // "Quá hạn", "Không có giáo viên xử lý" và "Học viên có nhiều báo cáo bị từ chối" đã tự giới hạn trạng thái;
        // áp thêm trạng thái mặc định thì quản trị viên (mặc định Chờ quản trị viên) không bao giờ thấy kết quả.
        boolean selfScoped = overdue || noHandler || frequentRejected;
        ReportStatus parsedStatus = status == null ? (selfScoped ? null : defaultStatus)
                : ALL.equalsIgnoreCase(status) ? null
                : ReportStatus.fromValue(status).orElseThrow(() -> new FieldValidationException("status", "Invalid"));
        ReportTargetType parsedType = type == null ? null
                : ReportTargetType.fromValue(type).orElseThrow(() -> new FieldValidationException("type", "Invalid"));
        ReportReason parsedReason = reason == null ? null
                : ReportReason.fromValue(reason).orElseThrow(() -> new FieldValidationException("reason", "Invalid"));
        return new ReportListQuery(parsedStatus, parsedType, parsedReason, overdue, q, OLDEST.equalsIgnoreCase(sort),
                ownerId, reporterId, noHandler, frequentRejected);
    }
}
