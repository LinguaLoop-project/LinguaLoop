package com.lingualoop.backend.review;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.practice.dto.ReviewPlanSentence;
import com.lingualoop.backend.security.CurrentUserId;

import lombok.RequiredArgsConstructor;

/** Phiên Ôn tập hằng ngày (UC-HT-05). Thẻ lấy từ {@code GET /vocab/review?limit=}, câu từ danh sách trong kế hoạch này. */
@RestController
@RequestMapping("/api/v1/review")
@RequiredArgsConstructor
public class DailyReviewController {

    private final DailyReviewService dailyReviewService;

    @GetMapping("/daily-plan")
    public ApiResponse<DailyPlanView> dailyPlan(@CurrentUserId UUID userId) {
        return ApiResponse.ok(dailyReviewService.plan(userId));
    }

    /** Câu của phiên Ôn câu riêng: mỗi chế độ tối đa {@code perMode} câu (mặc định 2, BR-HT-20). */
    @GetMapping("/sentence-plan")
    public ApiResponse<List<ReviewPlanSentence>> sentencePlan(@CurrentUserId UUID userId,
            @RequestParam(defaultValue = "2") int perMode) {
        return ApiResponse.ok(dailyReviewService.sentencePlan(userId, perMode));
    }
}
