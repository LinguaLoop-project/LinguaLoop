package com.lingualoop.backend.lesson.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.lesson.dto.request.TopicNameRequest;
import com.lingualoop.backend.lesson.dto.response.AdminTopicResponse;
import com.lingualoop.backend.lesson.service.AdminTopicService;
import com.lingualoop.backend.security.CurrentUserId;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Quản lý chủ đề bài học (UC-CD-01 đến 03). Chỉ quản trị viên. */
@RestController
@RequestMapping("/api/v1/admin/topics")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminTopicController {

    private final AdminTopicService service;

    /** {@code visible}: bỏ trống là mọi trạng thái, true là Đang hiển thị, false là Chưa hiển thị (BR-CD-04). */
    @GetMapping
    public ApiResponse<List<AdminTopicResponse>> list(@RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean visible) {
        return ApiResponse.ok(service.list(q, visible));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AdminTopicResponse> create(@CurrentUserId UUID adminId,
            @Valid @RequestBody TopicNameRequest request) {
        return ApiResponse.ok(service.create(adminId, request));
    }

    @PutMapping("/{topicId}")
    public ApiResponse<AdminTopicResponse> rename(@CurrentUserId UUID adminId, @PathVariable UUID topicId,
            @Valid @RequestBody TopicNameRequest request) {
        return ApiResponse.ok(service.rename(adminId, topicId, request));
    }
}
