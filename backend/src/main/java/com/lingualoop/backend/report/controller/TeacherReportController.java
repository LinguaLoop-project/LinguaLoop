package com.lingualoop.backend.report.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.report.dto.ReportView;
import com.lingualoop.backend.report.dto.request.ApplyFixRequest;
import com.lingualoop.backend.report.dto.request.HandleReportRequest;
import com.lingualoop.backend.report.enums.ReportStatus;
import com.lingualoop.backend.report.service.ReportReviewService;
import com.lingualoop.backend.security.CurrentUserId;

import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/**
 * Giáo viên xem và xử lý báo cáo lỗi nội dung về nội dung của mình (UC-XL-01 đến UC-XL-03). {@code SecurityConfig} cho
 * cả quản trị viên vào {@code /teacher/**}, nên lớp này chỉ nhận giáo viên.
 */
@RestController
@RequestMapping("/api/v1/teacher/reports")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
public class TeacherReportController {

    private final ReportReviewService reviewService;

    /** Mặc định chỉ dòng Chờ giáo viên; {@code status=all} xem mọi trạng thái (BR-XL-03). */
    @GetMapping
    public ApiResponse<PageResponse<ReportView.Item>> list(@CurrentUserId UUID userId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String reason,
            @RequestParam(defaultValue = "false") boolean overdue,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort,
            @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok(reviewService.listForTeacher(userId, ReportParams.query(status,
                ReportStatus.WAITING_TEACHER, type, reason, overdue, q, sort, null, null, false, false), page));
    }

    @GetMapping("/{reportId}")
    public ApiResponse<ReportView.Detail> detail(@CurrentUserId UUID userId, @PathVariable UUID reportId) {
        return ApiResponse.ok(reviewService.getForTeacher(userId, reportId));
    }

    /** Đánh dấu cả dòng Đã xử lý sau khi đã sửa nội dung (UC-XL-02). */
    /**
     * Ghi bản sửa đề xuất của một báo cáo trong dòng vào trường học viên đã chọn; dòng vẫn chờ giáo viên đánh dấu đã xử lý
     * (UC-XL-02 nhánh 2a, BR-XL-10). Báo cáo không kèm bản sửa trả 422.
     */
    @PostMapping("/{reportId}/apply-fix")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void applyFix(@CurrentUserId UUID userId, @PathVariable UUID reportId,
            @RequestBody ApplyFixRequest request) {
        if (request == null || request.entryId() == null) {
            throw new FieldValidationException("entryId", "NotNull");
        }
        reviewService.applyFix(userId, reportId, request.entryId());
    }

        @PostMapping("/{reportId}/resolve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void resolve(@CurrentUserId UUID userId, @PathVariable UUID reportId,
            @RequestBody HandleReportRequest request) {
        reviewService.resolve(userId, reportId, request.note());
    }

    /** Từ chối cả dòng kèm lý do (UC-XL-03). */
    @PostMapping("/{reportId}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@CurrentUserId UUID userId, @PathVariable UUID reportId,
            @RequestBody HandleReportRequest request) {
        reviewService.rejectByTeacher(userId, reportId, request.note());
    }
}
