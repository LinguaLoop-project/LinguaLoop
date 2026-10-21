package com.lingualoop.backend.subscription.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.subscription.dto.FeatureUsage;
import com.lingualoop.backend.subscription.service.UsageService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/me/usage")
@RequiredArgsConstructor
public class UsageController {

    public record UsageResponse(List<FeatureUsage> features) {
    }

    private final UsageService usageService;

    @GetMapping
    public ApiResponse<UsageResponse> getUsage(@CurrentUserId UUID userId) {
        return ApiResponse.ok(new UsageResponse(usageService.usageOf(userId)));
    }
}
