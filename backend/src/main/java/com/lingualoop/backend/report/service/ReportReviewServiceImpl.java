package com.lingualoop.backend.report.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.ForbiddenException;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.lesson.service.LessonModerationService;
import com.lingualoop.backend.report.dto.ReportView;
import com.lingualoop.backend.report.dto.request.ReportListQuery;
import com.lingualoop.backend.report.enums.ReportReason;
import com.lingualoop.backend.report.enums.ReportStatus;
import com.lingualoop.backend.report.enums.ReportTargetType;
import com.lingualoop.backend.report.repository.ClosedReport;
import com.lingualoop.backend.report.repository.ModerationRepository;
import com.lingualoop.backend.report.repository.ReportRepository;
import com.lingualoop.backend.report.repository.ReportRepository.Scope;
import com.lingualoop.backend.report.repository.ReportRepository.Window;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.vocab.service.VocabDeckContentService;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class ReportReviewServiceImpl implements ReportReviewService {

    static final int PAGE_SIZE = 10;
    /** Báo cáo lỗi nội dung chờ quá hạn này mang nhãn "Quá hạn" (BR-XL-11). */
    static final Duration OVERDUE_AFTER = Duration.ofDays(7);
    /** Báo cáo lỗi nội dung chờ quá hạn này thì quản trị viên được gỡ nội dung (BR-XL-11). */
    static final Duration TAKEDOWN_AFTER = Duration.ofDays(30);
    /** Khoảng tính số báo cáo đã gửi và bị từ chối của học viên (BR-XL-14). */
    static final Duration STATS_WINDOW = Duration.ofDays(30);
    /** Từ số báo cáo bị từ chối này, học viên vào bộ lọc "Học viên có nhiều báo cáo bị từ chối" (BR-XL-14). */
    static final int REJECTED_THRESHOLD = 5;

    static final String ACTION_RESOLVE = "resolve";
    static final String ACTION_REJECT = "reject";
    static final String ACTION_TAKEDOWN = "takedown";
    static final String ACTION_ASSIGN = "assign";

    private static final String NO_PERMISSION = "Bạn không có quyền xử lý báo cáo này";

    private final ReportRepository repository;
    private final ModerationRepository moderation;
    private final ReportAuditor auditor;
    private final Clock clock;
    private final LessonModerationService lessons;
    private final VocabDeckContentService cards;
    private final ReportOutcomeNotifier outcomes;

    // ---------------------------------------------------------------- danh sách và chi tiết (UC-XL-01)

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReportView.Item> listForTeacher(UUID teacherId, ReportListQuery query, int page) {
        return list(Scope.teacher(teacherId), query.forTeacher(), page);
    }

    @Override
    @Transactional(readOnly = true)
    public PageResponse<ReportView.Item> listForAdmin(ReportListQuery query, int page) {
        return list(Scope.admin(), query, page);
    }

    private PageResponse<ReportView.Item> list(Scope scope, ReportListQuery query, int page) {
        Window window = window();
        List<ReportView.Item> items = repository.findGroups(scope, query, window, PAGE_SIZE, (long) page * PAGE_SIZE);
        long total = repository.countGroups(scope, query, window);
        int totalPages = (int) ((total + PAGE_SIZE - 1) / PAGE_SIZE);
        return new PageResponse<>(items, page, PAGE_SIZE, total, totalPages);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportView.Detail getForTeacher(UUID teacherId, UUID reportId) {
        ReportView.Item item = teacherGroup(teacherId, reportId);
        List<ReportView.Entry> entries = repository.findGroupEntries(item.id()).stream()
                .map(e -> new ReportView.Entry(e.id(), e.reportedAt(), e.suggestedFix(), e.fixField(), e.description(),
                        e.status(), e.handledAt(), e.handledBy(), e.handlingNote(), null, null, null))
                .toList();
        List<String> actions = statusOf(item) == ReportStatus.WAITING_TEACHER
                ? List.of(ACTION_RESOLVE, ACTION_REJECT) : List.of();
        return detail(item, entries, actions, 0);
    }

    @Override
    @Transactional(readOnly = true)
    public ReportView.Detail getForAdmin(UUID reportId) {
        ReportView.Item item = group(reportId);
        List<ReportView.Entry> raw = repository.findGroupEntries(item.id());
        Set<UUID> reporters = raw.stream().map(ReportView.Entry::reporterId).collect(Collectors.toSet());
        Map<UUID, ReportView.ReporterStats> stats = repository.reporterStats(reporters,
                clock.instant().minus(STATS_WINDOW));
        List<ReportView.Entry> entries = raw.stream()
                .map(e -> new ReportView.Entry(e.id(), e.reportedAt(), e.suggestedFix(), e.fixField(), e.description(),
                        e.status(), e.handledAt(), e.handledBy(), e.handlingNote(), e.reporterId(), e.reporterName(),
                        stats.getOrDefault(e.reporterId(), new ReportView.ReporterStats(0, 0))))
                .toList();
        List<String> actions = adminActions(item);
        int takedownCount = 0;
        if (actions.contains(ACTION_TAKEDOWN)) {
            long offensive = moderation.countOpenOffensive(targetTypeOf(item), item.containerId());
            takedownCount = (int) (statusOf(item) == ReportStatus.WAITING_ADMIN ? offensive
                    : offensive + item.reportCount());
        }
        return detail(item, entries, actions, takedownCount);
    }

    private ReportView.Detail detail(ReportView.Item item, List<ReportView.Entry> entries, List<String> actions,
            int takedownCount) {
        ReportTargetType type = targetTypeOf(item);
        String imageUrl = type == ReportTargetType.CARD ? cards.cardImageUrl(item.targetId()).orElse(null) : null;
        return new ReportView.Detail(item, repository.snapshotOf(item.id()),
                repository.currentContent(type, item.targetId()), entries, actions, takedownCount, imageUrl);
    }

    /** Thao tác của quản trị viên theo trạng thái dòng (BR-XL-02). */
    private List<String> adminActions(ReportView.Item item) {
        List<String> actions = new ArrayList<>();
        ReportStatus status = statusOf(item);
        if (status == ReportStatus.WAITING_ADMIN) {
            actions.add(ACTION_TAKEDOWN);
            actions.add(ACTION_REJECT);
        } else if (status == ReportStatus.WAITING_TEACHER) {
            if (item.noHandler()) {
                actions.add(ACTION_ASSIGN);
                actions.add(ACTION_REJECT);
            }
            if (item.firstReportedAt().isBefore(clock.instant().minus(TAKEDOWN_AFTER))) {
                actions.add(ACTION_TAKEDOWN);
            }
        }
        return actions;
    }

    // ---------------------------------------------------------------- xử lý (UC-XL-02, UC-XL-03)

    @Override
    @Transactional
    public void resolve(UUID teacherId, UUID reportId, String note) {
        ReportView.Item item = openTeacherGroup(teacherId, reportId);
        String text = ReportTexts.required("note", note);
        ReportTargetType type = targetTypeOf(item);
        List<String> columns = columnsToCheck(item, type);
        if (!repository.hasChanged(item.id(), type, columns)) {
            throw new BusinessException(ErrorCode.REPORT_NOT_FIXED, Map.of("fields", columns));
        }
        close(item, ReportStatus.WAITING_TEACHER, ReportStatus.RESOLVED, teacherId, Role.TEACHER, text);
    }

    /**
     * Trường phải khác bản chụp để được đánh dấu Đã xử lý (BR-XL-05): báo cáo mới nhất của dòng (id dòng) có trường cần
     * sửa học viên đã chọn (BR-BC-11) thì chỉ trường đó; không có thì mọi trường của lý do. Trường đã chọn chỉ được nhận
     * khi thuộc các trường của lý do, vì tên cột được ghép vào câu lệnh so sánh.
     */
    private List<String> columnsToCheck(ReportView.Item item, ReportTargetType type) {
        List<String> byReason = ReportReason.fromValue(item.reason()).orElseThrow().changedColumns(type);
        return repository.findGroupEntries(item.id()).stream()
                .filter(e -> e.id().equals(item.id()))
                .map(ReportView.Entry::fixField)
                .filter(field -> field != null && byReason.contains(field))
                .findFirst()
                .map(List::of)
                .orElse(byReason);
    }

    @Override
    @Transactional
    public void applyFix(UUID teacherId, UUID reportId, UUID entryId) {
        ReportView.Item item = openTeacherGroup(teacherId, reportId);
        ReportView.Entry entry = repository.findGroupEntries(item.id()).stream()
                .filter(e -> e.id().equals(entryId))
                .findFirst()
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_NOT_FOUND));
        if (entry.suggestedFix() == null || entry.fixField() == null) {
            throw new BusinessException(ErrorCode.REPORT_FIX_UNAVAILABLE);
        }
        ReportTargetType type = targetTypeOf(item);
        // Áp dụng bản sửa là sửa nội dung, không ghi nhật ký; lần đánh dấu Đã xử lý sau đó mới ghi (BR-NK-18).
        if (type == ReportTargetType.SENTENCE) {
            lessons.applyReportFix(item.targetId(), entry.fixField(), entry.suggestedFix());
        } else {
            cards.applyReportFix(teacherId, item.targetId(), entry.fixField(), entry.suggestedFix());
        }
    }

    @Override
    @Transactional
    public void rejectByTeacher(UUID teacherId, UUID reportId, String reason) {
        ReportView.Item item = openTeacherGroup(teacherId, reportId);
        String text = ReportTexts.required("note", reason);
        close(item, ReportStatus.WAITING_TEACHER, ReportStatus.REJECTED, teacherId, Role.TEACHER, text);
    }

    @Override
    @Transactional
    public void rejectByAdmin(UUID adminId, UUID reportId, String reason) {
        ReportView.Item item = group(reportId);
        ReportStatus status = statusOf(item);
        if (!status.isOpen()) {
            throw new BusinessException(ErrorCode.REPORT_ALREADY_HANDLED);
        }
        if (status == ReportStatus.WAITING_TEACHER && !item.noHandler()) {
            throw new ForbiddenException(NO_PERMISSION);
        }
        String text = ReportTexts.required("note", reason);
        close(item, status, ReportStatus.REJECTED, adminId, Role.ADMIN, text);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReportView.Owner> listOwners() {
        return repository.findOwners();
    }

    @Override
    @Transactional
    public int rejectAllByReporter(UUID adminId, UUID studentId, String reason) {
        String text = ReportTexts.required("note", reason);
        List<ClosedReport> rejected = repository.rejectOpenByReporter(studentId, adminId, text, clock.instant());
        auditor.closed(rejected, ReportStatus.REJECTED, adminId, Role.ADMIN, text);
        outcomes.rejected(rejected.stream().map(ClosedReport::id).toList(), text);
        return rejected.size();
    }

    // ---------------------------------------------------------------- hỗ trợ

    private void close(ReportView.Item item, ReportStatus from, ReportStatus to, UUID actorId, Role role,
            String note) {
        List<UUID> closed = repository.closeGroup(item.id(), from, to, actorId, note, clock.instant());
        if (closed.isEmpty()) {
            throw new BusinessException(ErrorCode.REPORT_ALREADY_HANDLED);
        }
        auditor.closed(closed.stream().map(id -> new ClosedReport(id, from)).toList(), to, actorId, role, note);
        if (to == ReportStatus.RESOLVED) {
            outcomes.resolved(closed);
        } else {
            outcomes.rejected(closed, note);
        }
    }

    private Window window() {
        Instant now = clock.instant();
        return new Window(now.minus(OVERDUE_AFTER), now.minus(STATS_WINDOW), REJECTED_THRESHOLD);
    }

    private ReportView.Item group(UUID reportId) {
        return repository.findGroup(reportId, clock.instant().minus(OVERDUE_AFTER))
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_NOT_FOUND));
    }

    /**
     * Dòng báo cáo lỗi nội dung về nội dung của giáo viên (BR-XL-02, BR-XL-03). Báo cáo của bài học hoặc bộ thẻ đã xóa
     * đang bị ẩn khỏi giáo viên nên coi như không tồn tại (BR-XL-08).
     */
    private ReportView.Item teacherGroup(UUID teacherId, UUID reportId) {
        ReportView.Item item = group(reportId);
        if (!teacherId.equals(item.ownerId()) || ReportReason.OFFENSIVE.value().equals(item.reason())) {
            throw new ForbiddenException(NO_PERMISSION);
        }
        if (item.containerDeleted()) {
            throw new BusinessException(ErrorCode.REPORT_NOT_FOUND);
        }
        return item;
    }

    private ReportView.Item openTeacherGroup(UUID teacherId, UUID reportId) {
        ReportView.Item item = teacherGroup(teacherId, reportId);
        if (statusOf(item) != ReportStatus.WAITING_TEACHER) {
            throw new BusinessException(ErrorCode.REPORT_ALREADY_HANDLED);
        }
        return item;
    }

    private static ReportStatus statusOf(ReportView.Item item) {
        return ReportStatus.fromValue(item.status()).orElseThrow();
    }

    private static ReportTargetType targetTypeOf(ReportView.Item item) {
        return ReportTargetType.fromValue(item.targetType()).orElseThrow();
    }
}
