package com.lingualoop.backend.report.service;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.audit.dto.AuditChanges;
import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditService;
import com.lingualoop.backend.report.enums.ReportReason;
import com.lingualoop.backend.report.enums.ReportStatus;
import com.lingualoop.backend.report.repository.ClosedReport;
import com.lingualoop.backend.report.repository.ReportRepository;
import com.lingualoop.backend.report.repository.ReportRepository.AuditSubject;
import com.lingualoop.backend.security.Role;

import lombok.RequiredArgsConstructor;

/**
 * Ghi nhật ký của báo cáo theo một mẫu chung (BR-NK-03): tên đối tượng là câu hoặc từ bị báo cáo,
 * đối tượng chứa là bài học hoặc bộ thẻ, gửi báo cáo ghi lý do và trạng thái ban đầu, xử lý hoặc từ chối ghi trạng
 * thái cũ và mới. Chạy trong giao dịch của nơi gọi.
 */
@Component
@RequiredArgsConstructor
class ReportAuditor {

    private final ReportRepository repository;
    private final AuditService audit;

    /** Học viên gửi báo cáo; mô tả của học viên là ghi chú. */
    void submitted(UUID studentId, UUID reportId, ReportReason reason, ReportStatus status, String description) {
        AuditSubject subject = repository.findAuditSubjects(List.of(reportId)).get(0);
        Map<String, Object> changes = AuditChanges.create()
                .field("reason", null, reason.value())
                .field("status", null, status.value())
                .build();
        audit.record(entry(studentId, Role.STUDENT, AuditAction.CREATE, subject, changes, description));
    }

    /**
     * Mỗi báo cáo vừa đóng một mục (BR-XL-07): {@link AuditAction#RESOLVE} hoặc {@link AuditAction#REJECT} theo trạng
     * thái mới. {@code actorId} và {@code role} cùng {@code null} là Hệ thống.
     */
    void closed(List<ClosedReport> closed, ReportStatus to, UUID actorId, Role role, String note) {
        if (closed.isEmpty()) {
            return;
        }
        AuditAction action = to == ReportStatus.RESOLVED ? AuditAction.RESOLVE : AuditAction.REJECT;
        Map<UUID, AuditSubject> subjects = repository.findAuditSubjects(closed.stream().map(ClosedReport::id).toList())
                .stream().collect(Collectors.toMap(AuditSubject::id, Function.identity()));
        for (ClosedReport report : closed) {
            Map<String, Object> changes = AuditChanges.create()
                    .field("status", report.from().value(), to.value())
                    .build();
            audit.record(entry(actorId, role, action, subjects.get(report.id()), changes, note));
        }
    }

    private static AuditEntryRequest entry(UUID actorId, Role role, AuditAction action, AuditSubject subject,
            Map<String, Object> changes, String note) {
        AuditEntryRequest request = new AuditEntryRequest(actorId, null, role, action, AuditEntityType.REPORT,
                subject.id(), subject.content(), changes, note);
        return subject.containerId() == null ? request
                : request.withParent(subject.sentence() ? AuditEntityType.LESSON : AuditEntityType.DECK,
                        subject.containerId());
    }
}
