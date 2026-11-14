package com.lingualoop.backend.storage.controller;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.storage.dto.PresignUploadRequest;
import com.lingualoop.backend.storage.dto.PresignedUpload;
import com.lingualoop.backend.storage.service.FileStorageService;

import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Cấp URL tải tệp thẳng lên S3, dùng chung cho mọi màn hình có tải tệp. */
@RestController
@RequestMapping("/api/v1/uploads")
@RequiredArgsConstructor
public class UploadController {

    private final FileStorageService fileStorageService;

    @PostMapping("/presign")
    public ApiResponse<PresignedUpload> presign(
            @CurrentUserId UUID userId,
            @Parameter(hidden = true) Authentication authentication,
            @Valid @RequestBody PresignUploadRequest request) {
        if (!request.purpose().allowedFor(authentication.getAuthorities())) {
            throw new BusinessException(ErrorCode.FORBIDDEN);
        }
        return ApiResponse.ok(fileStorageService.presignUpload(
                userId, request.purpose(), request.contentType(), request.size()));
    }
}
