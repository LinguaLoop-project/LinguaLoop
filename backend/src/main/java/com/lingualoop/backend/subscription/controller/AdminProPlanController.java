package com.lingualoop.backend.subscription.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.subscription.dto.ProPlanView;
import com.lingualoop.backend.subscription.dto.request.ProPlanRequest;
import com.lingualoop.backend.subscription.dto.request.SetOnSaleRequest;
import com.lingualoop.backend.subscription.service.AdminProPlanService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Gói Pro (UC-GA-03 đến 06). Chỉ quản trị viên (BR-GA-01). */
@RestController
@RequestMapping("/api/v1/admin/pro-plans")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminProPlanController {

    private final AdminProPlanService service;

    @GetMapping
    public ApiResponse<List<ProPlanView>> list() {
        return ApiResponse.ok(service.list());
    }

    @PostMapping
    public ApiResponse<ProPlanView> create(@CurrentUserId UUID adminId, @Valid @RequestBody ProPlanRequest request) {
        return ApiResponse.ok(service.create(adminId, request));
    }

    @PutMapping("/{planId}")
    public ApiResponse<ProPlanView> update(@CurrentUserId UUID adminId, @PathVariable UUID planId,
            @Valid @RequestBody ProPlanRequest request) {
        return ApiResponse.ok(service.update(adminId, planId, request));
    }

    @PostMapping("/{planId}/on-sale")
    public ApiResponse<ProPlanView> setOnSale(@CurrentUserId UUID adminId, @PathVariable UUID planId,
            @Valid @RequestBody SetOnSaleRequest request) {
        return ApiResponse.ok(service.setOnSale(adminId, planId, request.onSale()));
    }
}
