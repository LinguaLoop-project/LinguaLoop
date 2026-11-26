package com.lingualoop.backend.report.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditService;
import com.lingualoop.backend.report.enums.ReportTargetType;
import com.lingualoop.backend.report.enums.ReportStatus;
import com.lingualoop.backend.report.repository.ClosedReport;
import com.lingualoop.backend.report.repository.ModerationRepository;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.service.NotificationService;

import lombok.RequiredArgsConstructor;

/**
 * Gắn dấu "Bị quản trị viên gỡ" cho bài học hoặc bộ thẻ, dùng chung cho gỡ từ báo cáo (UC-XL-04) và gỡ tay (UC-BH-07,
 * UC-BT-06) (BR-XL-13): đóng mọi báo cáo Phản cảm đang mở của nội dung, lưu bản chụp câu hoặc thẻ của các báo cáo đã
 * đóng, ghi nguồn gỡ, báo giáo viên chủ và ghi nhật ký. Việc đưa nội dung về Nháp do feature nội dung làm. Chạy trong
 * transaction của nơi gọi.
 */
@Component
@RequiredArgsConstructor
class TakedownMarker {

    private final ModerationRepository repository;
    private final NotificationService notifications;
    private final ReportOutcomeNotifier outcomes;
    private final AuditService audit;
    private final ReportAuditor auditor;

    /**
     * @param alreadyClosed báo cáo nơi gọi đã đóng (dòng báo cáo đang xử lý ở UC-XL-04); gỡ tay thì rỗng
     * @param ownerId giáo viên chủ, {@code null} nếu nội dung chưa gán chủ (chỉ lưu dấu, không báo ai)
     */
    void mark(UUID adminId, ReportTargetType type, UUID containerId, String containerName, UUID ownerId,
            String reason, String source, List<ClosedReport> alreadyClosed, Instant now) {
        List<ClosedReport> closed = new ArrayList<>(alreadyClosed);
        // Báo cáo Phản cảm chỉ chờ quản trị viên nên trạng thái trước khi đóng luôn là Chờ quản trị viên.
        repository.closeOpenOffensive(type, containerId, adminId, reason, now)
                .forEach(id -> closed.add(new ClosedReport(id, ReportStatus.WAITING_ADMIN)));
        repository.markTakenDown(type, containerId, reason,
                repository.snapshotOfReports(type, closed.stream().map(ClosedReport::id).toList()), adminId, now,
                source);

        if (ownerId != null) {
            notifications.send(ownerId, "%s \"%s\" đã bị quản trị viên gỡ: %s. Hãy sửa nội dung rồi gửi yêu cầu "
                    .formatted(kindLabel(type), containerName, reason) + "duyệt xuất bản lại.");
        }
        outcomes.resolved(closed.stream().map(ClosedReport::id).toList());
        auditor.closed(closed, ReportStatus.RESOLVED, adminId, Role.ADMIN, reason);
        audit.record(new AuditEntryRequest(adminId, null, Role.ADMIN, AuditAction.UNPUBLISH, entityOf(type),
                containerId, containerName, null, reason));
    }

    static String kindLabel(ReportTargetType type) {
        return type == ReportTargetType.SENTENCE ? "Bài học" : "Bộ thẻ";
    }

    static AuditEntityType entityOf(ReportTargetType type) {
        return type == ReportTargetType.SENTENCE ? AuditEntityType.LESSON : AuditEntityType.DECK;
    }
}
