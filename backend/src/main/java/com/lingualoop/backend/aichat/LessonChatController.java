package com.lingualoop.backend.aichat;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.lingualoop.backend.aichat.LessonChatView.HistoryItem;
import com.lingualoop.backend.aichat.LessonChatView.Hint;
import com.lingualoop.backend.aichat.LessonChatView.Session;
import com.lingualoop.backend.aichat.LessonChatView.Turn;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;

import lombok.RequiredArgsConstructor;

/** Thực hành với AI theo bài (UC-AI-01): trò chuyện với gia sư AI về nội dung cả bài học. */
@RestController
@RequestMapping("/api/v1/lessons/{lessonId}/ai-chat")
@PreAuthorize("hasRole('STUDENT')")
@RequiredArgsConstructor
public class LessonChatController {

    private final LessonChatService service;

    /** Cuộc trò chuyện đang mở để tiếp tục; {@code data} là null nếu không có. */
    @GetMapping("/active")
    public ApiResponse<Session> active(@CurrentUserId UUID userId, @PathVariable UUID lessonId) {
        return ApiResponse.ok(service.active(userId, lessonId));
    }

    /** Bắt đầu cuộc mới (cũng là "Bắt đầu lại": cuộc đang mở được đóng và giữ trong lịch sử). */
    @PostMapping("/sessions")
    public ApiResponse<Turn> start(@CurrentUserId UUID userId, @PathVariable UUID lessonId) {
        return ApiResponse.ok(service.start(userId, lessonId));
    }

    @GetMapping("/sessions")
    public ApiResponse<List<HistoryItem>> history(@CurrentUserId UUID userId, @PathVariable UUID lessonId) {
        return ApiResponse.ok(service.history(userId, lessonId));
    }

    @GetMapping("/sessions/{id}")
    public ApiResponse<Session> detail(@CurrentUserId UUID userId, @PathVariable UUID lessonId, @PathVariable UUID id) {
        return ApiResponse.ok(service.detail(userId, lessonId, id));
    }

    /** Trả lời bằng chữ ({@code text}) hoặc ghi âm WAV 16 kHz mono ({@code audio}); đúng một trong hai. */
    @PostMapping(value = "/sessions/{id}/answers", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<Turn> answer(@CurrentUserId UUID userId, @PathVariable UUID lessonId, @PathVariable UUID id,
            @RequestParam(value = "text", required = false) String text,
            @RequestPart(value = "audio", required = false) MultipartFile audio) throws IOException {
        return ApiResponse.ok(service.answer(userId, lessonId, id, text, audio == null ? null : audio.getBytes()));
    }

    @PostMapping("/sessions/{id}/hint")
    public ApiResponse<Hint> hint(@CurrentUserId UUID userId, @PathVariable UUID lessonId, @PathVariable UUID id) {
        return ApiResponse.ok(service.hint(userId, lessonId, id));
    }

    @PostMapping("/sessions/{id}/finish")
    public ApiResponse<Turn> finish(@CurrentUserId UUID userId, @PathVariable UUID lessonId, @PathVariable UUID id) {
        return ApiResponse.ok(service.finish(userId, lessonId, id));
    }
}
