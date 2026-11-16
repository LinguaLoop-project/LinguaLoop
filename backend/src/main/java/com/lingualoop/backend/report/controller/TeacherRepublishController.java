package com.lingualoop.backend.report.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.report.dto.RepublishView;
import com.lingualoop.backend.report.dto.request.RepublishRequest;
import com.lingualoop.backend.report.service.ReportModerationService;
import com.lingualoop.backend.security.CurrentUserId;

import lombok.RequiredArgsConstructor;

/**
 * Giáo viên xem dấu "Bị gỡ do báo cáo" của bài học hoặc bộ thẻ của mình và gửi yêu cầu xuất bản lại (UC-BH-06,
 * UC-BT-05 nhánh 2b đến 2d). {@code targetType}: {@code lesson} hoặc {@code deck}.
 */
@RestController
@RequestMapping("/api/v1/teacher/republish-requests")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
public class TeacherRepublishController {

    private final ReportModerationService moderationService;

    @GetMapping("/status")
    public ApiResponse<RepublishView.Status> status(@CurrentUserId UUID userId, @RequestParam String targetType,
            @RequestParam UUID targetId) {
        return ApiResponse.ok(moderationService.status(userId, targetType, targetId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void request(@CurrentUserId UUID userId, @RequestBody RepublishRequest request) {
        moderationService.requestRepublish(userId, request.targetType(), request.targetId());
    }
}
