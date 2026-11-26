package com.lingualoop.backend.report.service;

import java.time.Clock;
import java.util.Map;
import java.util.UUID;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.report.dto.request.SubmitReportRequest;
import com.lingualoop.backend.report.enums.ReportReason;
import com.lingualoop.backend.report.enums.ReportStatus;
import com.lingualoop.backend.report.enums.ReportTargetType;
import com.lingualoop.backend.report.repository.ReportRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
class ReportSubmitServiceImpl implements ReportSubmitService {

    private final ReportRepository repository;
    private final Clock clock;
    private final ReportAuditor auditor;

    @Override
    @Transactional
    public void submit(UUID studentId, SubmitReportRequest request) {
        ReportTargetType type = ReportTargetType.fromValue(request.targetType())
                .orElseThrow(() -> new FieldValidationException("targetType", "Invalid"));
        if (request.targetId() == null) {
            throw new FieldValidationException("targetId", "NotNull");
        }
        ReportReason reason = ReportReason.fromValue(request.reason())
                .filter(r -> r.appliesTo(type))
                .orElseThrow(() -> new FieldValidationException("reason", "Invalid"));
        String fixField = reason.requiresFix() ? fixFieldOf(reason, request.fixField()) : null;
        String fix = reason.requiresFix() ? ReportTexts.required("suggestedFix", request.suggestedFix()) : null;
        String description = reason.requiresFix() ? ReportTexts.optional("description", request.description())
                : ReportTexts.required("description", request.description());

        Map<String, String> current = repository.findVisibleContent(type, request.targetId())
                .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_TARGET_NOT_FOUND));
        if (fix != null && fix.equals(stripped(current.get(fixField)))) {
            throw new FieldValidationException("suggestedFix", "Different");
        }
        if (repository.existsOpen(studentId, type, request.targetId(), reason.value())) {
            throw new BusinessException(ErrorCode.REPORT_DUPLICATE);
        }
        ReportStatus status = reason.isViolation() ? ReportStatus.WAITING_ADMIN : ReportStatus.WAITING_TEACHER;
        UUID reportId;
        try {
            reportId = repository.insert(studentId, type, request.targetId(), reason.value(), status, fix, fixField,
                    description, clock.instant())
                    .orElseThrow(() -> new BusinessException(ErrorCode.REPORT_TARGET_NOT_FOUND));
        } catch (DataIntegrityViolationException ex) {
            // Hai lần gửi trùng chạy đồng thời: chỉ mục duy nhất uq_report_open_* chặn lần sau (BR-BC-08).
            throw new BusinessException(ErrorCode.REPORT_DUPLICATE);
        }
        // Học viên gửi báo cáo được ghi nhật ký (BR-XL-07, BR-NK-18).
        auditor.submitted(studentId, reportId, reason, status, description);
    }

    /** Trường cần sửa: lý do một trường thì chọn sẵn; nhiều trường thì phải chọn đúng một trường của lý do (BR-BC-11). */
    private static String fixFieldOf(ReportReason reason, String requested) {
        if (requested == null || requested.isBlank()) {
            if (reason.fixColumns().size() == 1) {
                return reason.fixColumns().get(0);
            }
            throw new FieldValidationException("fixField", "NotBlank");
        }
        if (!reason.fixColumns().contains(requested)) {
            throw new FieldValidationException("fixField", "Invalid");
        }
        return requested;
    }

    private static String stripped(String value) {
        return value == null ? null : value.strip();
    }
}
