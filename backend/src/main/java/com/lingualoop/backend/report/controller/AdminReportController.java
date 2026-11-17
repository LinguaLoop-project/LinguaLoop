package com.lingualoop.backend.report.controller;

import java.util.List;
import java.util.Map;
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

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.report.dto.ReportView;
import com.lingualoop.backend.report.dto.request.HandleReportRequest;
import com.lingualoop.backend.report.enums.ReportStatus;
import com.lingualoop.backend.report.service.ReportModerationService;
import com.lingualoop.backend.report.service.ReportReviewService;
import com.lingualoop.backend.security.CurrentUserId;

import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** Quản trị viên xem mọi báo cáo và xử lý báo cáo Phản cảm, báo cáo không có giáo viên xử lý, báo cáo rác. */
@RestController
@RequestMapping("/api/v1/admin/reports")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminReportController {

    private final ReportReviewService reviewService;
    private final ReportModerationService moderationService;

    /**
     * Mặc định chỉ dòng Chờ quản trị viên; {@code status=all} xem mọi trạng thái. Lọc thêm theo giáo viên chủ
     * ({@code ownerId}), học viên đã báo ({@code reporterId}), "Không có giáo viên xử lý" ({@code noHandler}) và "Học
     * viên có nhiều báo cáo bị từ chối" ({@code frequentRejected}), BR-XL-03.
     */
    @GetMapping
    public ApiResponse<PageResponse<ReportView.Item>> list(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) String reason,
            @RequestParam(defaultValue = "false") boolean overdue,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String sort,
            @RequestParam(required = false) UUID ownerId,
            @RequestParam(required = false) UUID reporterId,
            @RequestParam(defaultValue = "false") boolean noHandler,
            @RequestParam(defaultValue = "false") boolean frequentRejected,
            @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok(reviewService.listForAdmin(ReportParams.query(status, ReportStatus.WAITING_ADMIN, type,
                reason, overdue, q, sort, ownerId, reporterId, noHandler, frequentRejected), page));
    }

    @GetMapping("/{reportId}")
    public ApiResponse<ReportView.Detail> detail(@PathVariable UUID reportId) {
        return ApiResponse.ok(reviewService.getForAdmin(reportId));
    }

    @PostMapping("/{reportId}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@CurrentUserId UUID userId, @PathVariable UUID reportId,
            @RequestBody HandleReportRequest request) {
        reviewService.rejectByAdmin(userId, reportId, request.note());
    }

    /**
     * Gỡ bài học hoặc bộ thẻ chứa nội dung bị báo và đóng báo cáo (UC-XL-04); {@code note} là lý do gỡ, giáo viên chủ
     * thấy.
     */
    @PostMapping("/{reportId}/takedown")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void takedown(@CurrentUserId UUID userId, @PathVariable UUID reportId,
            @RequestBody HandleReportRequest request) {
        moderationService.takedown(userId, reportId, request.note());
    }

    /** Giáo viên chủ có nội dung bị báo, theo tên, cho bộ lọc "Giáo viên chủ" (UC-XL-01 Bước 5, AC-XL-09). */
    /**
     * Số báo cáo Phản cảm đang mở về nội dung của bài học hoặc bộ thẻ, để hộp gỡ tay nêu số báo cáo sẽ được đóng cùng
     * (UC-BH-07, UC-BT-06 Bước 2). {@code targetType}: {@code lesson} hoặc {@code deck}.
     */
    @GetMapping("/offensive-count")
    public ApiResponse<Map<String, Long>> offensiveCount(@RequestParam String targetType, @RequestParam UUID targetId) {
        return ApiResponse.ok(Map.of("count", moderationService.countOpenOffensive(targetType, targetId)));
    }

    @GetMapping("/owners")
    public ApiResponse<List<ReportView.Owner>> owners() {
        return ApiResponse.ok(reviewService.listOwners());
    }

    /** Từ chối mọi báo cáo đang mở của một học viên (UC-XL-03 nhánh 2a). */
    @PostMapping("/reporters/{studentId}/reject")
    public ApiResponse<Map<String, Integer>> rejectAllByReporter(@CurrentUserId UUID userId,
            @PathVariable UUID studentId, @RequestBody HandleReportRequest request) {
        return ApiResponse.ok(Map.of("rejected", reviewService.rejectAllByReporter(userId, studentId,
                request.note())));
    }
}
