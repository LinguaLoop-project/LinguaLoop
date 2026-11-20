package com.lingualoop.backend.lesson.controller;

import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.lesson.dto.WatchView;
import com.lingualoop.backend.lesson.service.WatchService;
import com.lingualoop.backend.security.CurrentUserId;

import lombok.RequiredArgsConstructor;

/** Học thụ động (UC-TC-04): lướt video ngắn của bài học, thích video và lưu câu. */
@RestController
@RequestMapping("/api/v1/watch")
@PreAuthorize("hasRole('STUDENT')")
@RequiredArgsConstructor
public class WatchController {

    private final WatchService watchService;

    /**
     * Một trang 10 video. {@code seed} giữ thứ tự cố định trong một phiên xem; {@code start} là bài mở từ trang chi tiết,
     * đứng đầu luồng.
     */
    @GetMapping("/feed")
    public ApiResponse<WatchView.Feed> feed(@CurrentUserId UUID userId, @RequestParam(required = false) String seed,
            @RequestParam(defaultValue = "0") int page, @RequestParam(required = false) UUID start) {
        return ApiResponse.ok(watchService.feed(userId, seed, page, start));
    }

    @PutMapping("/lessons/{lessonId}/like")
    public ApiResponse<WatchView.Like> like(@CurrentUserId UUID userId, @PathVariable UUID lessonId) {
        return ApiResponse.ok(watchService.like(userId, lessonId));
    }

    @DeleteMapping("/lessons/{lessonId}/like")
    public ApiResponse<WatchView.Like> unlike(@CurrentUserId UUID userId, @PathVariable UUID lessonId) {
        return ApiResponse.ok(watchService.unlike(userId, lessonId));
    }

    /** Lưu câu vào Câu cần ôn chế độ Shadowing, không cần lượt đọc trước (BR-TC-17). */
    @PutMapping("/sentences/{sentenceId}/saved")
    public ApiResponse<WatchView.Saved> save(@CurrentUserId UUID userId, @PathVariable UUID sentenceId) {
        return ApiResponse.ok(watchService.saveSentence(userId, sentenceId));
    }

    @DeleteMapping("/sentences/{sentenceId}/saved")
    public ApiResponse<WatchView.Saved> unsave(@CurrentUserId UUID userId, @PathVariable UUID sentenceId) {
        return ApiResponse.ok(watchService.unsaveSentence(userId, sentenceId));
    }
}
