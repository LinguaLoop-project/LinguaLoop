package com.lingualoop.backend.review;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.ReviewPlanSentence;
import com.lingualoop.backend.security.CurrentUserId;

import lombok.RequiredArgsConstructor;

/** Phiên Luyện tập hằng ngày (UC-HT-05). Thẻ lấy từ {@code GET /vocab/review?limit=}, câu từ danh sách trong kế hoạch này. */
@RestController
@RequestMapping("/api/v1/review")
@RequiredArgsConstructor
public class DailyReviewController {

    private final DailyReviewService dailyReviewService;

    @GetMapping("/daily-plan")
    public ApiResponse<DailyPlanView> dailyPlan(@CurrentUserId UUID userId) {
        return ApiResponse.ok(dailyReviewService.plan(userId));
    }

    /** Thẻ của phần ôn thẻ theo khung bài ngày; {@code extra=true} là lượt "Ôn thêm" chỉ có thẻ đến hạn (BR-HT-24, BR-HT-29). */
    @GetMapping("/daily-cards")
    public ApiResponse<DailyCardsView> dailyCards(@CurrentUserId UUID userId,
            @RequestParam(defaultValue = "false") boolean extra) {
        return ApiResponse.ok(dailyReviewService.dailyCards(userId, extra));
    }

    /**
     * Câu của phiên Ôn câu riêng: mỗi chế độ tối đa {@code perMode} câu (mặc định 2, BR-HT-20), hoặc đúng một câu khi
     * truyền cả {@code sentenceId} và {@code mode}.
     */
    @GetMapping("/sentence-plan")
    public ApiResponse<List<ReviewPlanSentence>> sentencePlan(@CurrentUserId UUID userId,
            @RequestParam(defaultValue = "2") int perMode,
            @RequestParam(required = false) UUID sentenceId,
            @RequestParam(required = false) PracticeMode mode) {
        return ApiResponse.ok(dailyReviewService.sentencePlan(userId, perMode, sentenceId, mode));
    }
}
