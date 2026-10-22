package com.lingualoop.backend.tutor.controller;

import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.tutor.TutorAttemptService;
import com.lingualoop.backend.tutor.TutorOfferService;
import com.lingualoop.backend.tutor.TutorSessionService;
import com.lingualoop.backend.tutor.dto.TutorDtos;

import java.io.IOException;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/tutor")
@RequiredArgsConstructor
public class TutorController {

    private final TutorOfferService offerService;
    private final TutorSessionService sessionService;
    private final TutorAttemptService attemptService;

    @PostMapping("/offers")
    public ApiResponse<TutorDtos.OfferResponse> offer(@CurrentUserId UUID userId,
            @Valid @RequestBody TutorDtos.OfferRequest request) {
        return ApiResponse.ok(offerService.evaluate(userId, request.attemptId()));
    }

    @PostMapping("/offers/{offerId}/decline")
    public ApiResponse<Void> decline(@CurrentUserId UUID userId, @PathVariable UUID offerId) {
        offerService.decline(userId, offerId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/lesson-events")
    public ApiResponse<Void> lessonEvent(@CurrentUserId UUID userId,
            @Valid @RequestBody TutorDtos.LessonEventRequest request) {
        try {
            offerService.recordLessonEvent(userId, request.lessonId(), request.event());
        } catch (IllegalArgumentException e) {
            throw new BusinessException(ErrorCode.VALIDATION_FAILED, "Sự kiện không hợp lệ");
        }
        return ApiResponse.ok(null);
    }

    @PostMapping("/sessions")
    public ApiResponse<TutorDtos.SessionResponse> createSession(@CurrentUserId UUID userId,
            @Valid @RequestBody TutorDtos.CreateSessionRequest request) {
        return ApiResponse.ok(sessionService.createSession(userId, request.attemptId(), request.offerId()));
    }

    @PostMapping("/sessions/{sessionId}/started")
    public ApiResponse<Void> started(@CurrentUserId UUID userId, @PathVariable UUID sessionId) {
        sessionService.started(userId, sessionId);
        return ApiResponse.ok(null);
    }

    @PostMapping("/sessions/{sessionId}/word")
    public ApiResponse<TutorDtos.SwitchResponse> switchWord(@CurrentUserId UUID userId, @PathVariable UUID sessionId,
            @Valid @RequestBody TutorDtos.SwitchRequest request) {
        return ApiResponse.ok(sessionService.switchWord(userId, sessionId, request.word()));
    }

    @PostMapping(value = "/sessions/{sessionId}/attempts", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<TutorDtos.AttemptResponse> attempt(@CurrentUserId UUID userId, @PathVariable UUID sessionId,
            @RequestPart("audio") MultipartFile audio, @RequestParam("target") String target) {
        try {
            return ApiResponse.ok(attemptService.attempt(userId, sessionId, audio.getBytes(), target));
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.SHADOWING_AUDIO_INVALID);
        }
    }

    @PostMapping("/sessions/{sessionId}/events")
    public ApiResponse<TutorDtos.EventResponse> event(@CurrentUserId UUID userId, @PathVariable UUID sessionId,
            @Valid @RequestBody TutorDtos.EventRequest request) {
        return ApiResponse.ok(switch (request.type()) {
            case "topic" -> sessionService.recordTopic(userId, sessionId, request.topic());
            case "end" -> sessionService.end(userId, sessionId, request.outcome());
            default -> throw new BusinessException(ErrorCode.VALIDATION_FAILED, "type phải là topic hoặc end");
        });
    }

    @GetMapping("/sessions/{sessionId}")
    public ApiResponse<TutorDtos.SessionSummary> session(@CurrentUserId UUID userId, @PathVariable UUID sessionId) {
        return ApiResponse.ok(sessionService.get(userId, sessionId));
    }
}
