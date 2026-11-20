package com.lingualoop.backend.lesson.controller;

import java.util.UUID;

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

    private static final int PAGE_SIZE = 12;

    private final LessonSaveService saveService;

    /**
     * Bài đã lưu, 12 bài mỗi trang. {@code state} là todo, doing hoặc done; {@code sort} là {@code saved_desc} (mặc định)
     * hoặc {@code saved_asc}.
     */
    @GetMapping("/saved")
    public ApiResponse<PageResponse<SavedLessonView>> list(@CurrentUserId UUID userId,
            @RequestParam(required = false) String q, @RequestParam(required = false) String state,
            @RequestParam(defaultValue = "saved_desc") String sort, @RequestParam(defaultValue = "0") int page) {
        return ApiResponse.ok(PageResponse.from(saveService.list(userId, q, LessonState.parse(state),
                "saved_asc".equals(sort), PageRequest.of(Math.max(page, 0), PAGE_SIZE))));
    }

    @PutMapping("/{lessonId}/saved")
    public ApiResponse<SavedLessonView.Saved> save(@CurrentUserId UUID userId, @PathVariable UUID lessonId) {
        return ApiResponse.ok(saveService.save(userId, lessonId));
    }

    @DeleteMapping("/{lessonId}/saved")
    public ApiResponse<SavedLessonView.Saved> unsave(@CurrentUserId UUID userId, @PathVariable UUID lessonId) {
        return ApiResponse.ok(saveService.unsave(userId, lessonId));
    }
}
