package com.lingualoop.backend.report.service;

import java.time.Clock;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditService;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.common.exception.ForbiddenException;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.lesson.service.LessonModerationService;
import com.lingualoop.backend.report.dto.ReportView;
import com.lingualoop.backend.report.dto.RepublishView;
import com.lingualoop.backend.report.enums.ReportStatus;
import com.lingualoop.backend.report.enums.ReportTargetType;
import com.lingualoop.backend.report.repository.ModerationRepository;
import com.lingualoop.backend.report.repository.ModerationRepository.ContainerRow;
import com.lingualoop.backend.report.repository.ModerationRepository.RequestRow;
import com.lingualoop.backend.report.repository.ModerationRepository.TakedownRow;
import com.lingualoop.backend.report.repository.ReportRepository;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.NotificationService;
import com.lingualoop.backend.user.service.UserAccountService;
import com.lingualoop.backend.vocab.service.DeckModerationService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class ReportModerationServiceImpl implements ReportModerationService {

    static final int PAGE_SIZE = 10;
    static final String LESSON = "lesson";
    static final String DECK = "deck";
    private static final String NO_PERMISSION = "Bạn không có quyền xử lý báo cáo này";

    private final ReportRepository reports;
    private final ModerationRepository repository;
    private final LessonModerationService lessons;
    private final DeckModerationService decks;
    private final NotificationService notifications;
    private final AuditService audit;
    private final UserAccountService users;
    private final Clock clock;

    // ---------------------------------------------------------------- gỡ nội dung (UC-XL-04)

    @Override
    @Transactional
    public void takedown(UUID adminId, UUID reportId, String reason) {
        Instant now = clock.instant();
        ReportView.Item item = reports.findGroup(reportId, now.minus(ReportReviewServiceImpl.OVERDUE_AFTER))
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_NOT_FOUND));
        ReportStatus status = ReportStatus.fromValue(item.status()).orElseThrow();
        if (!status.isOpen()) {
            throw new BusinessException(ErrorCode.REPORT_ALREADY_HANDLED);
        }
        if (!canTakedown(item, status, now)) {
            throw new ForbiddenException(NO_PERMISSION);
        }
        String text = ReportTexts.required("note", reason);
        ReportTargetType type = ReportTargetType.fromValue(item.targetType()).orElseThrow();
        UUID container = item.containerId();

        List<UUID> closed = new ArrayList<>(reports.closeGroup(item.id(), status, ReportStatus.RESOLVED, adminId,
                text, now));
        if (closed.isEmpty()) {
            throw new BusinessException(ErrorCode.REPORT_ALREADY_HANDLED);
        }
        closed.addAll(repository.closeOpenOffensive(type, container, adminId, text, now));
        repository.markTakenDown(type, container, text, repository.snapshotOfReports(type, closed), adminId, now);
        if (type == ReportTargetType.SENTENCE) {
            lessons.unpublishForReport(container, text);
        } else {
            decks.unpublishForReport(container, text);
        }

        if (item.ownerId() != null) {
            notifications.send(item.ownerId(), "%s \"%s\" đã bị gỡ do báo cáo: %s. Hãy sửa nội dung rồi gửi yêu cầu "
                    .formatted(kindLabel(type), item.containerName(), text) + "duyệt xuất bản lại.");
        }
        String actorName = nameOf(adminId);
        for (UUID id : closed) {
            audit.record(new AuditEntryRequest(adminId, actorName, Role.ADMIN, AuditAction.RESOLVE,
                    AuditEntityType.REPORT, id, null, Map.of("status", Map.of("new", "resolved")), text));
        }
        audit.record(new AuditEntryRequest(adminId, actorName, Role.ADMIN, AuditAction.UNPUBLISH, entityOf(type),
                container, item.containerName(), Map.of("takenDown", Map.of("new", true)), text));
    }

    /** Dòng Chờ quản trị viên, hoặc dòng lỗi nội dung đã chờ quá 30 ngày (BR-XL-02, BR-XL-11). */
    static boolean canTakedown(ReportView.Item item, ReportStatus status, Instant now) {
        return status == ReportStatus.WAITING_ADMIN || (status == ReportStatus.WAITING_TEACHER
                && item.firstReportedAt().isBefore(now.minus(ReportReviewServiceImpl.TAKEDOWN_AFTER)));
    }

    // ---------------------------------------------------------------- yêu cầu của giáo viên (UC-BH-06, UC-BT-05)

    @Override
    @Transactional(readOnly = true)
    public RepublishView.Status status(UUID teacherId, String targetType, UUID targetId) {
        ReportTargetType type = typeOf(targetType);
        ownedContainer(teacherId, type, targetId);
        return repository.findActiveTakedown(type, targetId)
                .map(t -> new RepublishView.Status(true, t.reason(), t.pending(), t.lastRejectReason(),
                        repository.takedownItems(t.id(), type)))
                .orElse(RepublishView.Status.none());
    }

    @Override
    @Transactional
    public void requestRepublish(UUID teacherId, String targetType, UUID targetId) {
        ReportTargetType type = typeOf(targetType);
        ownedContainer(teacherId, type, targetId);
        TakedownRow takedown = repository.findActiveTakedown(type, targetId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_TAKEDOWN_NOT_FOUND));
        if (takedown.pending()) {
            throw new BusinessException(ErrorCode.REPUBLISH_PENDING);
        }
        List<String> unchanged = repository.findUnchanged(takedown.id(), type);
        if (!unchanged.isEmpty()) {
            throw new BusinessException(ErrorCode.REPUBLISH_NOT_FIXED,
                    Map.of("unchanged", unchanged.size(), "items", unchanged));
        }
        try {
            repository.insertRequest(takedown.id(), teacherId, clock.instant());
        } catch (DataIntegrityViolationException ex) {
            // Hai lần gửi đồng thời: chỉ mục uq_republish_pending chặn lần sau (BR-XL-13).
            throw new BusinessException(ErrorCode.REPUBLISH_PENDING);
        }
    }

    private ContainerRow ownedContainer(UUID teacherId, ReportTargetType type, UUID targetId) {
        ContainerRow container = repository.findContainer(type, targetId)
                .filter(c -> !c.deleted())
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_TAKEDOWN_NOT_FOUND));
        if (!teacherId.equals(container.ownerId())) {
            throw new ForbiddenException();
        }
        return container;
    }

    // ---------------------------------------------------------------- duyệt (UC-XL-05)

    @Override
    @Transactional(readOnly = true)
    public PageResponse<RepublishView.Item> listPending(int page) {
        List<RepublishView.Item> items = repository.findPending(PAGE_SIZE, (long) page * PAGE_SIZE).stream()
                .map(ReportModerationServiceImpl::itemOf)
                .toList();
        long total = repository.countPending();
        return new PageResponse<>(items, page, PAGE_SIZE, total, (int) ((total + PAGE_SIZE - 1) / PAGE_SIZE));
    }

    @Override
    @Transactional(readOnly = true)
    public RepublishView.Detail getRequest(UUID requestId) {
        RequestRow row = repository.findRequest(requestId)
                .orElseThrow(() -> new BusinessException(ErrorCode.REPUBLISH_NOT_FOUND));
        List<RepublishView.Change> changes = repository.snapshotItems(row.takedownId(), row.type()).stream()
                .map(i -> new RepublishView.Change(i.targetId(), i.before(), i.after(), i.deleted()))
                .toList();
        return new RepublishView.Detail(itemOf(row), row.status(), changes);
    }

    @Override
    @Transactional
    public void approve(UUID adminId, UUID requestId) {
        RequestRow row = pendingRequest(requestId);
        if (row.type() == ReportTargetType.SENTENCE) {
            lessons.publishApproved(row.containerId());
        } else {
            decks.publishApproved(row.containerId());
        }
        Instant now = clock.instant();
        if (repository.decide(requestId, "approved", null, adminId, now) == 0) {
            throw new BusinessException(ErrorCode.REPUBLISH_NOT_FOUND);
        }
        repository.clearTakedown(row.takedownId(), now);
        if (row.ownerId() != null) {
            notifications.send(row.ownerId(), "%s \"%s\" đã được duyệt xuất bản lại."
                    .formatted(kindLabel(row.type()), row.containerName()));
        }
        audit.record(new AuditEntryRequest(adminId, nameOf(adminId), Role.ADMIN, AuditAction.PUBLISH,
                entityOf(row.type()), row.containerId(), row.containerName(), Map.of("takenDown", Map.of("new", false)),
                null));
    }

    @Override
    @Transactional
    public void reject(UUID adminId, UUID requestId, String reason) {
        String text = ReportTexts.required("note", reason);
        RequestRow row = pendingRequest(requestId);
        if (repository.decide(requestId, "rejected", text, adminId, clock.instant()) == 0) {
            throw new BusinessException(ErrorCode.REPUBLISH_NOT_FOUND);
        }
        if (row.ownerId() != null) {
            notifications.send(row.ownerId(), "Yêu cầu xuất bản lại %s \"%s\" bị từ chối: %s"
                    .formatted(kindLabel(row.type()).toLowerCase(Locale.ROOT), row.containerName(), text));
        }
        audit.record(new AuditEntryRequest(adminId, nameOf(adminId), Role.ADMIN, AuditAction.REJECT,
                entityOf(row.type()), row.containerId(), row.containerName(), null, text));
    }

    /** Yêu cầu còn chờ và nội dung còn tồn tại; không thì yêu cầu không còn hiệu lực (UC-XL-05 nhánh 3a). */
    private RequestRow pendingRequest(UUID requestId) {
        return repository.findRequest(requestId)
                .filter(r -> "pending".equals(r.status()) && !r.containerDeleted())
                .orElseThrow(() -> new BusinessException(ErrorCode.REPUBLISH_NOT_FOUND));
    }

    // ---------------------------------------------------------------- hỗ trợ

    private static RepublishView.Item itemOf(RequestRow row) {
        return new RepublishView.Item(row.id(), row.type() == ReportTargetType.SENTENCE ? LESSON : DECK,
                row.containerId(), row.containerName(), row.ownerName(), row.takedownReason(), row.requestedAt());
    }

    private static ReportTargetType typeOf(String targetType) {
        if (LESSON.equals(targetType)) {
            return ReportTargetType.SENTENCE;
        }
        if (DECK.equals(targetType)) {
            return ReportTargetType.CARD;
        }
        throw new FieldValidationException("targetType", "Invalid");
    }

    private static String kindLabel(ReportTargetType type) {
        return type == ReportTargetType.SENTENCE ? "Bài học" : "Bộ thẻ";
    }

    private static AuditEntityType entityOf(ReportTargetType type) {
        return type == ReportTargetType.SENTENCE ? AuditEntityType.LESSON : AuditEntityType.DECK;
    }

    private String nameOf(UUID userId) {
        return users.findById(userId).map(UserAccountView::displayName).orElse(null);
    }
}
