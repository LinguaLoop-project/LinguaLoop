package com.lingualoop.backend.stats.controller;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.stats.dto.AiUsageStatsView;
import com.lingualoop.backend.stats.dto.OverviewStatsView;
import com.lingualoop.backend.stats.dto.PlanFilter;
import com.lingualoop.backend.stats.dto.PracticeStatsView;
import com.lingualoop.backend.stats.dto.StatsPeriod;
import com.lingualoop.backend.stats.service.SystemStatsAdminService;

import lombok.RequiredArgsConstructor;

/** Thống kê hệ thống (UC-NK-02 đến 04). Chỉ quản trị viên (BR-NK-01); mặc định 30 ngày gần nhất (BR-NK-07). */
@RestController
@RequestMapping("/api/v1/admin/stats")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminStatsController {

    private final SystemStatsAdminService statsService;

    @GetMapping("/overview")
    public ApiResponse<OverviewStatsView> overview(@RequestParam(defaultValue = "D30") StatsPeriod period) {
        return ApiResponse.ok(statsService.overview(period));
    }

    @GetMapping("/practice")
    public ApiResponse<PracticeStatsView> practice(@RequestParam(defaultValue = "D30") StatsPeriod period,
            @RequestParam(defaultValue = "ALL") PlanFilter plan) {
        return ApiResponse.ok(statsService.practice(period, plan));
    }

    @GetMapping("/ai-usage")
    public ApiResponse<AiUsageStatsView> aiUsage(@RequestParam(defaultValue = "D30") StatsPeriod period) {
        return ApiResponse.ok(statsService.aiUsage(period));
    }
}
