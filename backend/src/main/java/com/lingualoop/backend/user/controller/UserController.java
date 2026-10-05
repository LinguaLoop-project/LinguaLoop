package com.lingualoop.backend.user.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.user.dto.MeResponse;
import com.lingualoop.backend.user.service.UserAccountService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserAccountService userAccountService;

    @GetMapping("/me")
    public ApiResponse<MeResponse> me(@CurrentUserId UUID userId) {
        // Token còn hạn nhưng tài khoản đã bị xoá: coi như chưa đăng nhập.
        return ApiResponse.ok(userAccountService.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED))
                .toMe());
    }
}
