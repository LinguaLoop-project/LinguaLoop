package com.lingualoop.backend.practice.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.practice.dto.ReviewSentenceView;
import com.lingualoop.backend.practice.service.SentenceReviewService;
import com.lingualoop.backend.security.CurrentUserId;

import lombok.RequiredArgsConstructor;

/** Danh sách Câu cần ôn của nghe chép. */
@RestController
@RequestMapping("/api/v1/review/dictation/sentences")
@RequiredArgsConstructor
public class SentenceReviewController {

    private final SentenceReviewService reviewService;

    @GetMapping
    public ApiResponse<List<ReviewSentenceView>> list(@CurrentUserId UUID userId) {
        return ApiResponse.ok(reviewService.list(userId));
    }

    /** Ghim câu vào danh sách; gọi lại khi câu đã ở trong danh sách không đổi gì. */
    @PutMapping("/{sentenceId}")
    public ApiResponse<Void> pin(@CurrentUserId UUID userId, @PathVariable UUID sentenceId) {
        reviewService.pin(userId, sentenceId);
        return ApiResponse.ok(null);
    }

    /** "Đã ổn" hoặc bỏ ghim: gỡ câu khỏi danh sách. */
    @DeleteMapping("/{sentenceId}")
    public ApiResponse<Void> resolve(@CurrentUserId UUID userId, @PathVariable UUID sentenceId) {
        reviewService.resolve(userId, sentenceId);
        return ApiResponse.ok(null);
    }
}
