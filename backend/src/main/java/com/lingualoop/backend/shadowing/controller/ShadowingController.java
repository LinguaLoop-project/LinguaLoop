package com.lingualoop.backend.shadowing.controller;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.shadowing.dto.AiFeedbackResponse;
import com.lingualoop.backend.shadowing.dto.LatestAttemptResponse;
import com.lingualoop.backend.shadowing.dto.ShadowingAttemptResponse;
import com.lingualoop.backend.shadowing.dto.ShadowingHistoryItem;
import com.lingualoop.backend.shadowing.service.AiFeedbackService;
import com.lingualoop.backend.shadowing.service.ShadowingAttemptService;

import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class ShadowingController {

    private final ShadowingAttemptService shadowingAttemptService;
    private final AiFeedbackService aiFeedbackService;

    @PostMapping(value = "/sentences/{sentenceId}/shadowing-attempts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ShadowingAttemptResponse> assess(
            @CurrentUserId UUID userId,
            @PathVariable UUID sentenceId,
            @RequestPart("audio") MultipartFile audio) {
        try {
            return ApiResponse.ok(shadowingAttemptService.assess(userId, sentenceId, audio.getBytes()));
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.SHADOWING_AUDIO_INVALID);
        }
    }

    @GetMapping("/lessons/{id}/shadowing-attempts/latest")
    public ApiResponse<List<LatestAttemptResponse>> latest(@CurrentUserId UUID userId, @PathVariable UUID id) {
        return ApiResponse.ok(shadowingAttemptService.latestByLesson(userId, id));
    }

    /** Nhận xét AI cho một lượt; lượt đã có nhận xét thì trả lại bản đã lưu (không trừ thêm lượt). */
    /** Lịch sử các lượt đọc của một câu, mới nhất trước. */
    @GetMapping("/sentences/{sentenceId}/shadowing-attempts")
    public ApiResponse<List<ShadowingHistoryItem>> history(@CurrentUserId UUID userId,
            @PathVariable UUID sentenceId) {
        return ApiResponse.ok(shadowingAttemptService.history(userId, sentenceId));
    }

    /** Kết quả đầy đủ của một lượt cũ (của chính người học). */
    @GetMapping("/shadowing-attempts/{attemptId}")
    public ApiResponse<LatestAttemptResponse> attempt(@CurrentUserId UUID userId, @PathVariable long attemptId) {
        return ApiResponse.ok(shadowingAttemptService.attempt(userId, attemptId));
    }

    @PostMapping("/shadowing-attempts/{attemptId}/ai-feedback")
    public ApiResponse<AiFeedbackResponse> aiFeedback(@CurrentUserId UUID userId, @PathVariable long attemptId) {
        return ApiResponse.ok(aiFeedbackService.feedbackFor(userId, attemptId));
    }

    /**
     * Như {@link #aiFeedback} nhưng phát dần bằng Server-Sent Events: nhiều sự kiện {@code delta} (đoạn chữ mới), rồi
     * {@code done} (nhận xét đầy đủ kèm mức dùng) hoặc {@code error}. Lỗi trước đoạn chữ đầu tiên (không phải của
     * mình, hết lượt, chưa đồng ý AI, Gemini lỗi) vẫn trả mã HTTP và JSON lỗi như bình thường.
     * shortcut: giữ một luồng xử lý của Tomcat suốt lúc AI viết (vài giây), đủ cho quy mô hiện tại; chuyển sang
     * SseEmitter khi số người xin nhận xét cùng lúc lớn.
     */
    @PostMapping("/shadowing-attempts/{attemptId}/ai-feedback/stream")
    public void aiFeedbackStream(@CurrentUserId UUID userId, @PathVariable long attemptId,
            HttpServletResponse response) {
        SseStream sse = new SseStream(response);
        try {
            AiFeedbackResponse result = aiFeedbackService.streamFeedbackFor(userId, attemptId,
                    text -> sse.send("delta", Map.of("text", text)));
            sse.send("done", doneEvent(result));
        } catch (UncheckedIOException e) {
            log.debug("Người học đã đóng trang trước khi nhận xét AI viết xong");
        } catch (BusinessException e) {
            if (!sse.started()) {
                throw e;
            }
            sse.send("error", Map.of("code", e.getErrorCode().name(), "message", e.getMessage()));
        } catch (RuntimeException e) {
            if (!sse.started()) {
                throw e;
            }
            log.error("Nhận xét AI phát dần lỗi giữa chừng", e);
            sse.send("error", Map.of("code", ErrorCode.INTERNAL_ERROR.name(),
                    "message", ErrorCode.INTERNAL_ERROR.getDefaultMessage()));
        }
    }

    private static Map<String, Object> doneEvent(AiFeedbackResponse r) {
        Map<String, Object> data = new LinkedHashMap<>();
        data.put("attemptId", r.attemptId());
        data.put("content", r.content());
        data.put("createdAt", r.createdAt() == null ? null : r.createdAt().toString());
        data.put("cached", r.cached());
        // SseStream tự dựng ObjectMapper không có module thời gian nên mốc đặt lại đi dưới dạng chuỗi
        Map<String, Object> credit = new LinkedHashMap<>();
        credit.put("balance", r.credit().balance());
        credit.put("kind", r.credit().kind());
        credit.put("resetsAt", r.credit().resetsAt() == null ? null : r.credit().resetsAt().toString());
        data.put("credit", credit);
        return data;
    }
}
