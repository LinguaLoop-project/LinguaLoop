package com.lingualoop.backend.user.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.user.dto.response.NotificationsResponse;
import com.lingualoop.backend.user.service.NotificationService;

import lombok.RequiredArgsConstructor;

/** Chuông thông báo trên thanh trên, dùng cho mọi vai trò: xem thông báo mới nhất và đánh dấu đã đọc. */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    /** Số thông báo mới nhất hiện trong chuông. */
    static final int LATEST = 20;

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<NotificationsResponse> latest(@CurrentUserId UUID userId) {
        return ApiResponse.ok(notificationService.latest(userId, LATEST));
    }

    /** Thông báo không phải của người dùng hoặc không tồn tại trả 404. */
    @PostMapping("/{notificationId}/read")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markRead(@CurrentUserId UUID userId, @PathVariable UUID notificationId) {
        notificationService.markRead(userId, notificationId);
    }

    @PostMapping("/read-all")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void markAllRead(@CurrentUserId UUID userId) {
        notificationService.markAllRead(userId);
    }
}
