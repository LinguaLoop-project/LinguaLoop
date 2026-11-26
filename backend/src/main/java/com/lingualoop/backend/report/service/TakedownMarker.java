package com.lingualoop.backend.report.service;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditService;
import com.lingualoop.backend.report.enums.ReportTargetType;
import com.lingualoop.backend.report.repository.ModerationRepository;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.NotificationService;
import com.lingualoop.backend.user.service.UserAccountService;

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
    private final UserAccountService users;

    /**
     * @param alreadyClosed báo cáo nơi gọi đã đóng (dòng báo cáo đang xử lý ở UC-XL-04); gỡ tay thì rỗng
     * @param ownerId giáo viên chủ, {@code null} nếu nội dung chưa gán chủ (chỉ lưu dấu, không báo ai)
     */
    void mark(UUID adminId, ReportTargetType type, UUID containerId, String containerName, UUID ownerId,
            String reason, String source, List<UUID> alreadyClosed, Instant now) {
        List<UUID> closed = new ArrayList<>(alreadyClosed);
        closed.addAll(repository.closeOpenOffensive(type, containerId, adminId, reason, now));
        repository.markTakenDown(type, containerId, reason, repository.snapshotOfReports(type, closed), adminId, now,
                source);

        if (ownerId != null) {
            notifications.send(ownerId, "%s \"%s\" đã bị quản trị viên gỡ: %s. Hãy sửa nội dung rồi gửi yêu cầu "
                    .formatted(kindLabel(type), containerName, reason) + "duyệt xuất bản lại.");
        }
        outcomes.resolved(closed);
        String actorName = users.findById(adminId).map(UserAccountView::displayName).orElse(null);
        for (UUID id : closed) {
            audit.record(new AuditEntryRequest(adminId, actorName, Role.ADMIN, AuditAction.RESOLVE,
                    AuditEntityType.REPORT, id, null, Map.of("status", Map.of("new", "resolved")), reason));
        }
        audit.record(new AuditEntryRequest(adminId, actorName, Role.ADMIN, AuditAction.UNPUBLISH, entityOf(type),
                containerId, containerName, Map.of("takenDown", Map.of("new", true), "source", Map.of("new", source)),
                reason));
    }

    static String kindLabel(ReportTargetType type) {
        return type == ReportTargetType.SENTENCE ? "Bài học" : "Bộ thẻ";
    }

    static AuditEntityType entityOf(ReportTargetType type) {
        return type == ReportTargetType.SENTENCE ? AuditEntityType.LESSON : AuditEntityType.DECK;
    }
}
