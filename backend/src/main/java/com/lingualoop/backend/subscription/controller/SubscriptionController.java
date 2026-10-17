package com.lingualoop.backend.subscription.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.subscription.dto.PlanResponse;
import com.lingualoop.backend.subscription.service.SubscriptionQueryService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/subscriptions")
@RequiredArgsConstructor
public class SubscriptionController {

    private final SubscriptionQueryService subscriptionQueryService;

    @GetMapping("/me")
    public ApiResponse<PlanResponse> getMyPlan(@CurrentUserId UUID userId) {
        return ApiResponse.ok(PlanResponse.of(subscriptionQueryService.isPro(userId)));
    }
}
