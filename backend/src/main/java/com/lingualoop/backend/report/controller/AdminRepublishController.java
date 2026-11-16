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

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.report.dto.RepublishView;
import com.lingualoop.backend.report.dto.request.HandleReportRequest;
import com.lingualoop.backend.report.service.ReportModerationService;
import com.lingualoop.backend.security.CurrentUserId;

import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** Quản trị viên duyệt yêu cầu xuất bản lại bài học hoặc bộ thẻ bị gỡ do báo cáo (UC-XL-05). */
@RestController
@RequestMapping("/api/v1/admin/republish-requests")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminRepublishController {

    private final ReportModerationService moderationService;

    /** Yêu cầu đang chờ, cũ nhất trước. */
    @GetMapping
    public ApiResponse<PageResponse<RepublishView.Item>> list(@RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok(moderationService.listPending(page));
    }

    @GetMapping("/{requestId}")
    public ApiResponse<RepublishView.Detail> detail(@PathVariable UUID requestId) {
        return ApiResponse.ok(moderationService.getRequest(requestId));
    }

    @PostMapping("/{requestId}/approve")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@CurrentUserId UUID userId, @PathVariable UUID requestId) {
        moderationService.approve(userId, requestId);
    }

    /** Từ chối kèm lý do ({@code note}), nội dung vẫn Nháp và giữ dấu. */
    @PostMapping("/{requestId}/reject")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reject(@CurrentUserId UUID userId, @PathVariable UUID requestId,
            @RequestBody HandleReportRequest request) {
        moderationService.reject(userId, requestId, request.note());
    }
}
