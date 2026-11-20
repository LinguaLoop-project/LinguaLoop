package com.lingualoop.backend.aichat;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.aichat.LessonChatView.Credit;
import com.lingualoop.backend.aichat.LessonChatView.HistoryItem;
import com.lingualoop.backend.aichat.LessonChatView.Hint;
import com.lingualoop.backend.aichat.LessonChatView.LiveStart;
import com.lingualoop.backend.aichat.LessonChatView.Session;
import com.lingualoop.backend.aichat.LessonChatView.Turn;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;

import lombok.RequiredArgsConstructor;

/**
 * Thực hành với AI theo bài (UC-AI-01): trò chuyện với gia sư AI về nội dung cả bài học. Chế độ giọng nói ({@code
 * /live-sessions}) chạy trên Gemini Live, trình duyệt nối thẳng và báo lại từng lượt qua các endpoint dưới đây; chế độ
 * chat chữ ({@code /sessions}) là dự phòng.
 */
@RestController
@RequestMapping("/api/v1/lessons/{lessonId}/ai-chat")
@PreAuthorize("hasRole('STUDENT')")
@RequiredArgsConstructor
public class LessonChatController {

    private final LessonChatService service;

    record QuestionRequest(String question) {
    }

    record FeedbackRequest(String answer, String feedback, String better) {
    }

    record AnswerRequest(String text) {
    }

    // ── Chế độ giọng nói ───────────────────────────────────────────────────────────

    /** Mở phiên giọng nói (cũng là "Bắt đầu lại": cuộc đang mở được đóng và giữ trong lịch sử); chưa trừ credit. */
    @PostMapping("/live-sessions")
    public ApiResponse<LiveStart> startLive(@CurrentUserId UUID userId, @PathVariable UUID lessonId) {
        return ApiResponse.ok(service.startLive(userId, lessonId));
    }

    /** Gia sư đã nói câu đầu: trừ credit cố định một lần. */
    @PostMapping("/live-sessions/{id}/started")
    public ApiResponse<Credit> liveStarted(@CurrentUserId UUID userId, @PathVariable UUID lessonId,
            @PathVariable UUID id) {
        return ApiResponse.ok(service.liveStarted(userId, lessonId, id));
    }

    @PostMapping("/live-sessions/{id}/questions")
    public ApiResponse<Session> liveQuestion(@CurrentUserId UUID userId, @PathVariable UUID lessonId,
            @PathVariable UUID id, @RequestBody QuestionRequest request) {
        return ApiResponse.ok(service.liveQuestion(userId, lessonId, id, request.question()));
    }

    @PostMapping("/live-sessions/{id}/feedback")
    public ApiResponse<Session> liveFeedback(@CurrentUserId UUID userId, @PathVariable UUID lessonId,
            @PathVariable UUID id, @RequestBody FeedbackRequest request) {
        return ApiResponse.ok(service.liveFeedback(userId, lessonId, id, request.answer(), request.feedback(),
                request.better()));
    }

    @PostMapping("/live-sessions/{id}/finish")
    public ApiResponse<Turn> liveFinish(@CurrentUserId UUID userId, @PathVariable UUID lessonId,
            @PathVariable UUID id) {
        return ApiResponse.ok(service.liveFinish(userId, lessonId, id));
    }

    // ── Chế độ chat chữ ────────────────────────────────────────────────────────────

    /** Bắt đầu cuộc chat chữ mới (đóng cuộc đang mở, giữ trong lịch sử). */
    @PostMapping("/sessions")
    public ApiResponse<Turn> start(@CurrentUserId UUID userId, @PathVariable UUID lessonId) {
        return ApiResponse.ok(service.start(userId, lessonId));
    }

    @PostMapping("/sessions/{id}/answers")
    public ApiResponse<Turn> answer(@CurrentUserId UUID userId, @PathVariable UUID lessonId, @PathVariable UUID id,
            @RequestBody AnswerRequest request) {
        return ApiResponse.ok(service.answer(userId, lessonId, id, request.text()));
    }

    @PostMapping("/sessions/{id}/finish")
    public ApiResponse<Turn> finish(@CurrentUserId UUID userId, @PathVariable UUID lessonId, @PathVariable UUID id) {
        return ApiResponse.ok(service.finish(userId, lessonId, id));
    }

    // ── Dùng chung ─────────────────────────────────────────────────────────────────

    @GetMapping("/sessions")
    public ApiResponse<List<HistoryItem>> history(@CurrentUserId UUID userId, @PathVariable UUID lessonId) {
        return ApiResponse.ok(service.history(userId, lessonId));
    }

    @GetMapping("/sessions/{id}")
    public ApiResponse<Session> detail(@CurrentUserId UUID userId, @PathVariable UUID lessonId, @PathVariable UUID id) {
        return ApiResponse.ok(service.detail(userId, lessonId, id));
    }

    /** Gợi ý cho câu hỏi đang chờ; miễn phí, dùng cho cả hai chế độ. */
    @PostMapping("/sessions/{id}/hint")
    public ApiResponse<Hint> hint(@CurrentUserId UUID userId, @PathVariable UUID lessonId, @PathVariable UUID id) {
        return ApiResponse.ok(service.hint(userId, lessonId, id));
    }
}
