package com.lingualoop.backend.tutor.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.tutor.TutorOfferService;
import com.lingualoop.backend.tutor.TutorSessionService;
import com.lingualoop.backend.tutor.dto.TutorDtos;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/v1/tutor")
@RequiredArgsConstructor
public class TutorController {

    private final TutorOfferService offerService;
    private final TutorSessionService sessionService;

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
}
