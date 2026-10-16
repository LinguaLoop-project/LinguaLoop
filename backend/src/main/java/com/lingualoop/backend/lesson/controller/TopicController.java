package com.lingualoop.backend.lesson.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.lesson.dto.response.TopicResponse;
import com.lingualoop.backend.lesson.dto.response.TopicRowResponse;
import com.lingualoop.backend.lesson.service.LessonQueryService;
import com.lingualoop.backend.security.CurrentUserId;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/topics")
@RequiredArgsConstructor
public class TopicController {

    private final LessonQueryService lessonQueryService;

    @GetMapping
    public ApiResponse<List<TopicResponse>> getTopics(@CurrentUserId UUID userId) {
        return ApiResponse.ok(lessonQueryService.getTopics(userId));
    }

    @GetMapping("/{slug}")
    public ApiResponse<TopicRowResponse> getTopic(@CurrentUserId UUID userId, @PathVariable String slug) {
        return ApiResponse.ok(lessonQueryService.getTopic(slug, userId));
    }
}
