package com.lingualoop.backend.practice.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.ReviewSentenceView;
import com.lingualoop.backend.practice.enums.ReviewReason;
import com.lingualoop.backend.practice.service.SentenceReviewService;
import com.lingualoop.backend.security.CurrentUserId;

import lombok.RequiredArgsConstructor;

/** Danh sách Câu cần ôn; {@code mode} là {@code dictation} hoặc {@code shadowing}. */
@RestController
@RequestMapping("/api/v1/review")
@RequiredArgsConstructor
public class SentenceReviewController {

    private final SentenceReviewService reviewService;

    /** Câu cần ôn của cả hai chế độ, mỗi câu kèm chế độ của nó. */
    @GetMapping("/sentences")
    public ApiResponse<List<ReviewSentenceView>> listAll(@CurrentUserId UUID userId,
            @RequestParam(required = false) String lessonSlug) {
        return ApiResponse.ok(reviewService.list(userId, null, lessonSlug));
    }

    @GetMapping("/{mode}/sentences")
    public ApiResponse<List<ReviewSentenceView>> list(@CurrentUserId UUID userId, @PathVariable PracticeMode mode,
            @RequestParam(required = false) String lessonSlug) {
        return ApiResponse.ok(reviewService.list(userId, mode, lessonSlug));
    }

    /**
     * Lưu câu vào danh sách; gọi lại khi câu đã ở trong danh sách không đổi gì. {@code reason} là {@code manual} (mặc
     * định, tự ghim) hoặc {@code low_score} (chọn lưu ở hộp hỏi sau lượt điểm thấp).
     */
    @PutMapping("/{mode}/sentences/{sentenceId}")
    public ApiResponse<Void> pin(@CurrentUserId UUID userId, @PathVariable PracticeMode mode,
            @PathVariable UUID sentenceId, @RequestParam(defaultValue = "manual") ReviewReason reason) {
        if (reason != ReviewReason.manual && reason != ReviewReason.low_score) {
            throw new BusinessException(ErrorCode.BAD_REQUEST);
        }
        reviewService.pin(userId, sentenceId, mode, reason);
        return ApiResponse.ok(null);
    }

    /** "Đã ổn" hoặc bỏ ghim: gỡ câu khỏi danh sách. */
    @DeleteMapping("/{mode}/sentences/{sentenceId}")
    public ApiResponse<Void> resolve(@CurrentUserId UUID userId, @PathVariable PracticeMode mode,
            @PathVariable UUID sentenceId) {
        reviewService.resolve(userId, sentenceId, mode);
        return ApiResponse.ok(null);
    }
}
