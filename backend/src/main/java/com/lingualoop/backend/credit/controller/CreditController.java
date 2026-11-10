package com.lingualoop.backend.credit.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.credit.CreditService;
import com.lingualoop.backend.credit.dto.CreditBalance;
import com.lingualoop.backend.security.CurrentUserId;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/credits")
@RequiredArgsConstructor
public class CreditController {

    private final CreditService creditService;

    @GetMapping("/balance")
    public ApiResponse<CreditBalance> balance(@CurrentUserId UUID userId) {
        return ApiResponse.ok(creditService.balanceOf(userId));
    }
}
