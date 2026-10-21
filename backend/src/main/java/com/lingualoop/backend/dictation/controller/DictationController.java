package com.lingualoop.backend.dictation.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.dictation.dto.request.RevealWordRequest;
import com.lingualoop.backend.dictation.dto.request.SubmitAttemptRequest;
import com.lingualoop.backend.dictation.dto.response.AttemptResultResponse;
import com.lingualoop.backend.dictation.dto.response.DictationLessonResponse;
import com.lingualoop.backend.dictation.dto.response.PromptResponse;
import com.lingualoop.backend.dictation.dto.response.RevealWordResponse;
import com.lingualoop.backend.dictation.service.DictationService;
import com.lingualoop.backend.practice.enums.DictationLevel;
import com.lingualoop.backend.security.CurrentUserId;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/dictation")
@RequiredArgsConstructor
public class DictationController {

    private final DictationService dictationService;

    @GetMapping("/lessons/{slug}")
    public ApiResponse<DictationLessonResponse> getLesson(@CurrentUserId UUID userId, @PathVariable String slug) {
        return ApiResponse.ok(dictationService.getLesson(userId, slug));
    }

    @GetMapping("/sentences/{id}/prompt")
    public ApiResponse<PromptResponse> getPrompt(@CurrentUserId UUID userId, @PathVariable UUID id,
            @RequestParam DictationLevel level) {
        return ApiResponse.ok(dictationService.getPrompt(userId, id, level));
    }

    @PostMapping("/sentences/{id}/reveal")
    public ApiResponse<RevealWordResponse> revealWord(@CurrentUserId UUID userId, @PathVariable UUID id,
            @Valid @RequestBody RevealWordRequest request) {
        return ApiResponse.ok(dictationService.revealWord(userId, id, request));
    }

    @GetMapping("/sentences/{id}/attempts/latest")
    public ApiResponse<AttemptResultResponse> getLatestAttempt(@CurrentUserId UUID userId, @PathVariable UUID id) {
        return ApiResponse.ok(dictationService.getLatestAttempt(userId, id));
    }

    @PostMapping("/sentences/{id}/attempts")
    public ApiResponse<AttemptResultResponse> submitAttempt(@CurrentUserId UUID userId, @PathVariable UUID id,
            @Valid @RequestBody SubmitAttemptRequest request) {
        return ApiResponse.ok(dictationService.submitAttempt(userId, id, request));
    }
}
