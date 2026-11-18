package com.lingualoop.backend.report.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.report.dto.request.SubmitReportRequest;
import com.lingualoop.backend.report.service.ReportSubmitService;
import com.lingualoop.backend.security.CurrentUserId;

import lombok.RequiredArgsConstructor;

/** Học viên gửi báo cáo về câu hoặc thẻ (UC-BC-01). Học viên không xem được báo cáo đã gửi (BR-BC-02). */
@RestController
@RequestMapping("/api/v1/reports")
@PreAuthorize("hasRole('STUDENT')")
@RequiredArgsConstructor
public class ReportController {

    private final ReportSubmitService submitService;

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public void submit(@CurrentUserId UUID userId, @RequestBody SubmitReportRequest request) {
        submitService.submit(userId, request);
    }
}
