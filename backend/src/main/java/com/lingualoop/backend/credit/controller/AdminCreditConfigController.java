package com.lingualoop.backend.credit.controller;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.credit.dto.CreditConfigView;
import com.lingualoop.backend.credit.dto.UpdateCreditConfigRequest;
import com.lingualoop.backend.credit.service.AdminCreditConfigService;
import com.lingualoop.backend.security.CurrentUserId;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Cấu hình credit (UC-GA-01, UC-GA-02). Chỉ quản trị viên (BR-GA-01). */
@RestController
@RequestMapping("/api/v1/admin/credit-config")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminCreditConfigController {

    private final AdminCreditConfigService service;

    @GetMapping
    public ApiResponse<CreditConfigView> get() {
        return ApiResponse.ok(service.get());
    }

    @PutMapping
    public ApiResponse<CreditConfigView> update(@CurrentUserId UUID adminId,
            @Valid @RequestBody UpdateCreditConfigRequest request) {
        return ApiResponse.ok(service.update(adminId, request));
    }
}
