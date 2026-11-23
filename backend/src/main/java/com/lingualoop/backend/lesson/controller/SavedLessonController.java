package com.lingualoop.backend.lesson.controller;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.PageRequest;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.lesson.dto.SavedLessonView;
import com.lingualoop.backend.lesson.enums.LessonState;
import com.lingualoop.backend.lesson.service.LessonSaveService;
import com.lingualoop.backend.security.CurrentUserId;

import lombok.RequiredArgsConstructor;

/** Bài đã lưu (UC-TC-05): chỉ học viên. */
@RestController
@RequestMapping("/api/v1/lessons")
@PreAuthorize("hasRole('STUDENT')")
@RequiredArgsConstructor
public class SavedLessonController {

    private static final int DEFAULT_PAGE_SIZE = 12;
    private static final int MAX_PAGE_SIZE = 48;

    private final LessonSaveService saveService;

    /**
     * Bài đã lưu, hỗ trợ tìm kiếm, lọc theo tiến độ/trình độ/chủ đề/miễn phí/thời lượng, sắp xếp và phân trang.
     */
    @GetMapping("/saved")
    public ApiResponse<PageResponse<SavedLessonView>> list(@CurrentUserId UUID userId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String cefrLevel,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) Boolean free,
            @RequestParam(required = false) Integer maxDuration,
            @RequestParam(defaultValue = "saved_desc") String sort,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "" + DEFAULT_PAGE_SIZE) int size) {
        int clampedSize = Math.min(Math.max(size, 1), MAX_PAGE_SIZE);
        LessonSaveService.Filter filter = new LessonSaveService.Filter(
                q, LessonState.parse(state), parseLevels(cefrLevel), topic, free, maxDuration, sort);
        return ApiResponse.ok(PageResponse.from(
                saveService.list(userId, filter, PageRequest.of(Math.max(page, 0), clampedSize))));
    }

    /** Thống kê tổng quan toàn bộ Bài đã lưu của học viên (đếm theo tiến độ, chủ đề, tổng thời lượng). */
    @GetMapping("/saved/summary")
    public ApiResponse<SavedLessonView.Summary> summary(@CurrentUserId UUID userId) {
        return ApiResponse.ok(saveService.summary(userId));
    }

    /** Bỏ lưu tất cả các bài đã hoàn thành. */
    @DeleteMapping("/saved/completed")
    public ApiResponse<SavedLessonView.Cleared> clearCompleted(@CurrentUserId UUID userId) {
        return ApiResponse.ok(saveService.clearCompleted(userId));
    }

    @PutMapping("/{lessonId}/saved")
    public ApiResponse<SavedLessonView.Saved> save(@CurrentUserId UUID userId, @PathVariable UUID lessonId) {
        return ApiResponse.ok(saveService.save(userId, lessonId));
    }

    @DeleteMapping("/{lessonId}/saved")
    public ApiResponse<SavedLessonView.Saved> unsave(@CurrentUserId UUID userId, @PathVariable UUID lessonId) {
        return ApiResponse.ok(saveService.unsave(userId, lessonId));
    }

    private static Set<String> parseLevels(String raw) {
        if (raw == null || raw.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(raw.split(","))
                .map(s -> s.strip().toUpperCase(Locale.ROOT))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toUnmodifiableSet());
    }
}
