package com.lingualoop.backend.report.service;

import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.audit.dto.request.AuditEntryRequest;
import com.lingualoop.backend.audit.enums.AuditAction;
import com.lingualoop.backend.audit.enums.AuditEntityType;
import com.lingualoop.backend.audit.service.AuditService;
import com.lingualoop.backend.report.repository.ModerationRepository;
import com.lingualoop.backend.report.repository.ModerationRepository.RemindedGroup;
import com.lingualoop.backend.user.service.NotificationService;

import lombok.RequiredArgsConstructor;

/**
 * Tự cập nhật báo cáo (UC-XL-06, tác nhân Hệ thống): nhắc quá hạn theo lịch, đóng báo cáo về nội dung đã xóa. Người
 * thực hiện ghi là "Hệ thống" (BR-XL-07).
 */
@Service
@RequiredArgsConstructor
public class ReportMaintenanceService implements ReportCleanupService {

    /** Bài học hoặc bộ thẻ xóa quá hạn này thì không khôi phục được nữa (BR-XL-08). */
    static final Duration RESTORE_WINDOW = Duration.ofDays(30);
    static final String NOTE_DELETED = "Hệ thống đóng: nội dung đã bị xóa";
    static final String NOTE_PURGED = "Hệ thống đóng: nội dung đã bị xóa vĩnh viễn";

    /** Câu, thẻ hoặc nhóm thẻ đã bị xóa riêng (nhánh 1a). */
    private static final String DELETED_ITEM = """
            EXISTS (SELECT 1 FROM sentences s WHERE s.id = cr.sentence_id AND s.deleted_at IS NOT NULL)
            OR EXISTS (SELECT 1 FROM vocab_cards c JOIN vocab_groups g ON g.id = c.group_id
                       WHERE c.id = cr.card_id AND (c.deleted_at IS NOT NULL OR g.deleted_at IS NOT NULL))""";

    private final ModerationRepository repository;
    private final NotificationService notifications;
    private final AuditService audit;
    private final Clock clock;

    /** Kết quả một lượt: số dòng được nhắc, số giáo viên nhận thông báo, số báo cáo được đóng. */
    public record RunResult(int remindedGroups, int notifiedTeachers, int closedReports) {
    }

    /** Một lượt kiểm tra theo lịch (UC-XL-06 Bước 1 đến 4, nhánh 1c, 2a, 3a). */
    @Transactional
    public RunResult runOnce() {
        Instant now = clock.instant();
        List<RemindedGroup> reminded = repository.markOverdueReminded(now.minus(ReportReviewServiceImpl.OVERDUE_AFTER),
                now);
        // Dòng không có giáo viên xử lý vẫn mang nhãn "Quá hạn" nhưng không gửi thông báo (nhánh 3a, BR-XL-12).
        Map<UUID, Long> perTeacher = reminded.stream()
                .filter(g -> !g.noHandler() && g.ownerId() != null)
                .collect(Collectors.groupingBy(RemindedGroup::ownerId, Collectors.counting()));
        perTeacher.forEach((teacher, count) -> notifications.send(teacher,
                "Bạn có %d báo cáo chờ quá 7 ngày".formatted(count)));

        List<UUID> closed = repository.closeWhere(DELETED_ITEM, Map.of(), NOTE_DELETED, now);
        List<UUID> purged = repository.closeForPermanentlyDeleted(now.minus(RESTORE_WINDOW), NOTE_PURGED, now);
        record(closed, NOTE_DELETED);
        record(purged, NOTE_PURGED);
        return new RunResult(reminded.size(), perTeacher.size(), closed.size() + purged.size());
    }

    // ---------------------------------------------------------------- đóng ngay khi xóa (nhánh 1a)

    @Override
    @Transactional
    public void closeForDeletedCard(UUID cardId) {
        close("cr.card_id = :id", cardId);
    }

    @Override
    @Transactional
    public void closeForDeletedGroup(UUID groupId) {
        close("cr.card_id IN (SELECT id FROM vocab_cards WHERE group_id = :id)", groupId);
    }

    @Override
    @Transactional
    public void closeForDeletedSentence(UUID sentenceId) {
        close("cr.sentence_id = :id", sentenceId);
    }

    private void close(String where, UUID id) {
        record(repository.closeWhere(where, Map.of("id", id), NOTE_DELETED, clock.instant()), NOTE_DELETED);
    }

    private void record(List<UUID> reportIds, String note) {
        Function<UUID, AuditEntryRequest> entry = id -> new AuditEntryRequest(null, null, null, AuditAction.RESOLVE,
                AuditEntityType.REPORT, id, null, Map.of("status", Map.of("new", "resolved")), note);
        reportIds.forEach(id -> audit.record(entry.apply(id)));
    }
}
