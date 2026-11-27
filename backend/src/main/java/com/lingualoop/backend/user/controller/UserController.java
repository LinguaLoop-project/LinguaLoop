package com.lingualoop.backend.user.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.dto.request.AvatarRequest;
import com.lingualoop.backend.user.dto.request.LearningProfileRequest;
import com.lingualoop.backend.user.dto.response.MeResponse;
import com.lingualoop.backend.user.service.UserAccountService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
public class UserController {

    private final UserAccountService userAccountService;

    @GetMapping("/me")
    public ApiResponse<MeResponse> me(@CurrentUserId UUID userId) {
        // Token còn hạn nhưng tài khoản đã bị xoá: coi như chưa đăng nhập.
        UserAccountView account = userAccountService.findById(userId)
                .orElseThrow(() -> new BusinessException(ErrorCode.UNAUTHORIZED));
        return ApiResponse.ok(userAccountService.toMe(account));
    }

    /** UC-TK-08: học viên điền hồ sơ lần đầu hoặc sửa lại thời lượng, ngôn ngữ, múi giờ trong Cài đặt. */
    @PutMapping("/me/learning-profile")
    public ApiResponse<MeResponse> saveLearningProfile(@CurrentUserId UUID userId,
            @Valid @RequestBody LearningProfileRequest request) {
        UserAccountView account = userAccountService.saveLearningProfile(userId, request.displayName(),
                request.dailyMinutes(), request.uiLanguage(), request.timezone(), request.acceptTerms());
        return ApiResponse.ok(userAccountService.toMe(account));
    }

    /** UC-TK-10: học viên đặt ảnh đại diện từ tệp đã tải lên S3 (mục đích {@code AVATAR}). */
    @PutMapping("/me/avatar")
    public ApiResponse<MeResponse> setAvatar(@CurrentUserId UUID userId, @Valid @RequestBody AvatarRequest request) {
        return ApiResponse.ok(userAccountService.toMe(userAccountService.setAvatar(userId, request.key())));
    }

    /** UC-TK-10: bỏ ảnh tự tải lên, quay về ảnh Google hoặc chữ cái đầu. */
    @DeleteMapping("/me/avatar")
    public ApiResponse<MeResponse> removeAvatar(@CurrentUserId UUID userId) {
        return ApiResponse.ok(userAccountService.toMe(userAccountService.removeAvatar(userId)));
    }
}
