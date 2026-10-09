package com.lingualoop.backend.lesson.controller;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.lesson.dto.TopicResponse;
import com.lingualoop.backend.lesson.dto.TopicRow;
import com.lingualoop.backend.lesson.service.LessonQueryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/topics")
@RequiredArgsConstructor
public class TopicController {

    private final LessonQueryService lessonQueryService;

    @GetMapping
    public ApiResponse<List<TopicResponse>> getTopics() {
        // TODO: Get authenticated user id
        UUID userId = UUID.randomUUID();
        return ApiResponse.ok(lessonQueryService.getTopics(userId));
    }

    @GetMapping("/{slug}")
    public ApiResponse<TopicRow> getTopic(@PathVariable String slug) {
        UUID userId = UUID.randomUUID();
        return ApiResponse.ok(lessonQueryService.getTopic(slug, userId));
    }
}
