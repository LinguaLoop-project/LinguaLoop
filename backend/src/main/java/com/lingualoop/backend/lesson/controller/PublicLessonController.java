package com.lingualoop.backend.lesson.controller;

import java.time.Duration;

import org.springframework.http.CacheControl;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.lesson.dto.ShowcaseView;
import com.lingualoop.backend.lesson.service.LessonShowcaseService;

import lombok.RequiredArgsConstructor;

/** API công khai cho trang chủ, không cần đăng nhập (BR-TC-20). */
@RestController
@RequestMapping("/api/v1/public/lessons")
@RequiredArgsConstructor
public class PublicLessonController {

    /** Trình duyệt được giữ kết quả một lúc để khách tải lại trang chủ không gọi lại máy chủ. */
    static final Duration BROWSER_CACHE = Duration.ofMinutes(10);

    private final LessonShowcaseService showcaseService;

    @GetMapping("/showcase")
    public ResponseEntity<ApiResponse<ShowcaseView>> showcase() {
        return ResponseEntity.ok()
                .cacheControl(CacheControl.maxAge(BROWSER_CACHE).cachePublic())
                .body(ApiResponse.ok(showcaseService.showcase()));
    }
}
