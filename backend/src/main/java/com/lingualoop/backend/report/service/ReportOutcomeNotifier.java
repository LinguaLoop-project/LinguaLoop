package com.lingualoop.backend.report.service;

import java.util.Collection;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.report.repository.ReportRepository;
import com.lingualoop.backend.user.service.NotificationService;
import com.lingualoop.backend.user.service.NotificationType;

import lombok.RequiredArgsConstructor;

/**
 * Báo kết quả xử lý cho học viên đã gửi báo cáo (BR-TK-22): "đã xử lý" khi nội dung được sửa hoặc bị gỡ, "không được chấp
 * nhận" kèm lý do khi bị từ chối. Mỗi báo cáo chỉ báo một lần dù nhiều luồng cùng đóng nó.
 */
@Component
@RequiredArgsConstructor
class ReportOutcomeNotifier {

    private final ReportRepository repository;
    private final NotificationService notifications;

    void resolved(Collection<UUID> reportIds) {
        repository.reporterIdsOf(reportIds).forEach((reportId, reporterId) -> notifications.send(reporterId,
                NotificationType.REPORT_RESOLVED,
                "Báo cáo của bạn đã được xử lý. Cảm ơn bạn đã giúp cải thiện nội dung.", null, Map.of(),
                "report-result:" + reportId));
    }

    void rejected(Collection<UUID> reportIds, String reason) {
        repository.reporterIdsOf(reportIds).forEach((reportId, reporterId) -> notifications.send(reporterId,
                NotificationType.REPORT_REJECTED, "Báo cáo của bạn không được chấp nhận: " + reason, null,
                Map.of("reason", reason), "report-result:" + reportId));
    }
}
