package com.lingualoop.backend.lesson.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.lesson.dto.response.LessonDetailResponse;
import com.lingualoop.backend.lesson.dto.response.LessonSummaryResponse;
import com.lingualoop.backend.lesson.dto.response.LibraryOverviewResponse;
import com.lingualoop.backend.lesson.dto.response.SentenceResponse;
import com.lingualoop.backend.lesson.enums.LessonState;
import com.lingualoop.backend.lesson.service.LessonQueryService;
import com.lingualoop.backend.security.CurrentUserId;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonQueryService lessonQueryService;

    /**
     * @param state todo | doing | done: lọc theo tiến độ của người dùng hiện tại
     *              (TODO: tham số {@code mode} chưa hỗ trợ cho tới khi có dữ liệu luyện tập)
     */
    @GetMapping
    public ApiResponse<PageResponse<LessonSummaryResponse>> searchLessons(
            @CurrentUserId UUID userId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Boolean free,
            @RequestParam(required = false) String state,
            Pageable pageable) {
        return ApiResponse.ok(PageResponse.from(lessonQueryService.searchLessons(
                q, topic, difficulty, free, LessonState.parse(state), userId, pageable)));
    }

    @GetMapping("/overview")
    public ApiResponse<LibraryOverviewResponse> getOverview(@CurrentUserId UUID userId) {
        return ApiResponse.ok(lessonQueryService.getOverview(userId));
    }

    @GetMapping("/{slug}")
    public ApiResponse<LessonDetailResponse> getLessonDetail(@CurrentUserId UUID userId, @PathVariable String slug) {
        return ApiResponse.ok(lessonQueryService.getLessonDetail(slug, userId));
    }

    @GetMapping("/{slug}/sentences")
    public ApiResponse<List<SentenceResponse>> getSentences(@CurrentUserId UUID userId, @PathVariable String slug) {
        return ApiResponse.ok(lessonQueryService.getSentences(slug, userId));
    }
}
