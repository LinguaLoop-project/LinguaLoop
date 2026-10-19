package com.lingualoop.backend.shadowing.controller;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.shadowing.dto.AiFeedbackResponse;
import com.lingualoop.backend.shadowing.dto.LatestAttemptResponse;
import com.lingualoop.backend.shadowing.dto.ShadowingAttemptResponse;
import com.lingualoop.backend.shadowing.service.AiFeedbackService;
import com.lingualoop.backend.shadowing.service.ShadowingAttemptService;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ShadowingController {

    private final ShadowingAttemptService shadowingAttemptService;
    private final AiFeedbackService aiFeedbackService;

    @PostMapping(value = "/sentences/{sentenceId}/shadowing-attempts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ShadowingAttemptResponse> assess(
            @CurrentUserId UUID userId,
            @PathVariable UUID sentenceId,
            @RequestPart("audio") MultipartFile audio) {
        try {
            return ApiResponse.ok(shadowingAttemptService.assess(userId, sentenceId, audio.getBytes()));
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.SHADOWING_AUDIO_INVALID);
        }
    }

    @GetMapping("/lessons/{slug}/shadowing-attempts/latest")
    public ApiResponse<List<LatestAttemptResponse>> latest(@CurrentUserId UUID userId, @PathVariable String slug) {
        return ApiResponse.ok(shadowingAttemptService.latestByLesson(userId, slug));
    }

    /** Nhận xét AI cho một lượt; lượt đã có nhận xét thì trả lại bản đã lưu (không trừ thêm lượt). */
    @PostMapping("/shadowing-attempts/{attemptId}/ai-feedback")
    public ApiResponse<AiFeedbackResponse> aiFeedback(@CurrentUserId UUID userId, @PathVariable long attemptId) {
        return ApiResponse.ok(aiFeedbackService.feedbackFor(userId, attemptId));
    }
}
