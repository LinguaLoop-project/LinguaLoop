package com.lingualoop.backend.user.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.exception.FieldValidationException;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.user.dto.request.NotificationPreferenceRequest;
import com.lingualoop.backend.user.dto.response.NotificationPreferencesResponse;
import com.lingualoop.backend.user.dto.response.NotificationsResponse;
import com.lingualoop.backend.user.service.NotificationService;
import com.lingualoop.backend.user.service.NotificationType;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Chuông thông báo trên thanh trên, dùng cho mọi vai trò: xem thông báo mới nhất và đánh dấu đã đọc. */
@RestController
@RequestMapping("/api/v1/notifications")
@RequiredArgsConstructor
public class NotificationController {

    /** Số thông báo mới nhất hiện trong chuông. */
    static final int LATEST = 20;

    /** Số thông báo mỗi trang của trang Thông báo; chặn trang quá xa để offset không phình ra. */
    static final int PAGE_SIZE = 20;
    private static final int MAX_PAGE = 5000;

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<NotificationsResponse> latest(@CurrentUserId UUID userId) {
        return ApiResponse.ok(notificationService.latest(userId, LATEST));
    }

    /**
     * Trang Thông báo đầy đủ (BR-TK-18): {@code filter} là {@code all} (mặc định) hoặc {@code unread}; {@code page} từ 0,
     * mỗi trang {@value #PAGE_SIZE} thông báo.
     */
    @GetMapping("/all")
    public ApiResponse<PageResponse<NotificationsResponse.Item>> all(@CurrentUserId UUID userId,
            @RequestParam(defaultValue = "all") String filter, @RequestParam(defaultValue = "0") int page) {
        if (!"all".equals(filter) && !"unread".equals(filter)) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "filter phải là all hoặc unread");
        }
        return ApiResponse.ok(notificationService.page(userId, "unread".equals(filter), Math.min(page, MAX_PAGE),
                PAGE_SIZE));
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

    /** Các loại thông báo nhắc học viên bật hoặc tắt được, kèm trạng thái hiện tại (BR-TK-23). */
    @GetMapping("/preferences")
    public ApiResponse<NotificationPreferencesResponse> preferences(@CurrentUserId UUID userId) {
        return ApiResponse.ok(new NotificationPreferencesResponse(notificationService.preferences(userId).entrySet()
                .stream().map(e -> new NotificationPreferencesResponse.Item(e.getKey().name(), e.getValue())).toList()));
    }

    /** Bật hoặc tắt một loại; loại không có hoặc không tùy chọn được trả 400. */
    @PutMapping("/preferences/{type}")
    public ApiResponse<NotificationPreferencesResponse> setPreference(@CurrentUserId UUID userId,
            @PathVariable String type, @Valid @RequestBody NotificationPreferenceRequest request) {
        NotificationType parsed;
        try {
            parsed = NotificationType.valueOf(type);
        } catch (IllegalArgumentException e) {
            throw new FieldValidationException("type", "NotConfigurable");
        }
        notificationService.setPreference(userId, parsed, request.enabled());
        return preferences(userId);
    }
}
