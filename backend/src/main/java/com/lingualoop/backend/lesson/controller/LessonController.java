package com.lingualoop.backend.lesson.controller;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.lesson.dto.LessonDetail;
import com.lingualoop.backend.lesson.dto.LessonSummary;
import com.lingualoop.backend.lesson.dto.LibraryOverview;
import com.lingualoop.backend.lesson.dto.SentenceResponse;
import com.lingualoop.backend.lesson.service.LessonQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/lessons")
@RequiredArgsConstructor
public class LessonController {

    private final LessonQueryService lessonQueryService;

    @GetMapping
    public ApiResponse<Page<LessonSummary>> searchLessons(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String difficulty,
            @RequestParam(required = false) Boolean free,
            @RequestParam(required = false) String state,
            @RequestParam(required = false) String mode,
            Pageable pageable) {
        // TODO: Get authenticated user id
        return ApiResponse.ok(lessonQueryService.searchLessons(q, topic, difficulty, free, state, mode, pageable));
    }

    @GetMapping("/overview")
    public ApiResponse<LibraryOverview> getOverview() {
        UUID userId = UUID.randomUUID();
        return ApiResponse.ok(lessonQueryService.getOverview(userId));
    }

    @GetMapping("/{slug}")
    public ApiResponse<LessonDetail> getLessonDetail(@PathVariable String slug) {
        UUID userId = UUID.randomUUID();
        return ApiResponse.ok(lessonQueryService.getLessonDetail(slug, userId));
    }

    @GetMapping("/{slug}/sentences")
    public ApiResponse<List<SentenceResponse>> getSentences(@PathVariable String slug) {
        UUID userId = UUID.randomUUID();
        return ApiResponse.ok(lessonQueryService.getSentences(slug, userId));
    }
}
