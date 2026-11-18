package com.lingualoop.backend.report.dto.request;

import java.util.UUID;

/**
 * Học viên gửi báo cáo về một câu hoặc một thẻ (UC-BC-01). {@code targetType}: {@code sentence} hoặc {@code card};
 * {@code reason}: mã lý do của {@code ReportReason}. Lý do có bản sửa bắt buộc {@code suggestedFix}, các lý do còn lại
 * bắt buộc {@code description} (BR-BC-05).
 * {@code fixField} là trường cần sửa (BR-BC-11), bắt buộc khi lý do có nhiều trường.
 */
public record SubmitReportRequest(
        String targetType,
        UUID targetId,
        String reason,
        String suggestedFix,
        String fixField,
        String description) {
}
