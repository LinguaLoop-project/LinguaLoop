package com.lingualoop.backend.vocab.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.vocab.dto.LearnView;
import com.lingualoop.backend.vocab.dto.ReviewView;
import com.lingualoop.backend.vocab.service.VocabReviewService;

import lombok.RequiredArgsConstructor;

/** Ôn thẻ từ vựng đến hạn (UC-HT-03). Chấm từng thẻ bằng {@code POST /vocab/sessions/{id}/answers}. */
@RestController
@RequestMapping("/api/v1/vocab/review")
@RequiredArgsConstructor
public class VocabReviewController {

    private final VocabReviewService reviewService;

    /** Lượt ôn tiếp theo: tối đa 50 thẻ đến hạn; truyền {@code deck} để chỉ ôn một bộ. */
    @GetMapping
    public ApiResponse<ReviewView.Queue> queue(@CurrentUserId UUID userId, @RequestParam(required = false) String deck) {
        return ApiResponse.ok(reviewService.queue(userId, deck));
    }

    /** Mở phiên ôn mới (đóng phiên còn mở); truyền {@code deck} khi ôn riêng một bộ. */
    @PostMapping("/sessions")
    public ApiResponse<LearnView.SessionRef> openSession(@CurrentUserId UUID userId,
            @RequestParam(required = false) String deck) {
        return ApiResponse.ok(reviewService.openSession(userId, deck));
    }
}
