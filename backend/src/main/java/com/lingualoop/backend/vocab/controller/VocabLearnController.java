package com.lingualoop.backend.vocab.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.vocab.dto.LearnView;
import com.lingualoop.backend.vocab.dto.request.AnswerRequest;
import com.lingualoop.backend.vocab.service.VocabLearnService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Học từ mới một phần (UC-VOCAB-05). Số phần trên đường dẫn tính từ 1. */
@RestController
@RequestMapping("/api/v1/vocab")
@RequiredArgsConstructor
public class VocabLearnController {

    private final VocabLearnService learnService;

    /** Các thẻ của phần kèm tiến độ; 403 nếu phần bị khoá với gói Free. */
    @GetMapping("/decks/{slug}/parts/{part}")
    public ApiResponse<LearnView.PartDetail> part(@CurrentUserId UUID userId, @PathVariable String slug,
            @PathVariable int part) {
        return ApiResponse.ok(learnService.part(userId, slug, part));
    }

    /** Mở phiên học mới cho phần này. */
    @PostMapping("/decks/{slug}/parts/{part}/sessions")
    public ApiResponse<LearnView.SessionRef> openSession(@CurrentUserId UUID userId, @PathVariable String slug,
            @PathVariable int part) {
        return ApiResponse.ok(learnService.openSession(userId, slug, part));
    }

    /** Ghi một câu trả lời trong phiên; gửi lại cùng {@code answerId} thì không ghi lại. */
    @PostMapping("/sessions/{sessionId}/answers")
    public ApiResponse<LearnView.AnswerResult> answer(@CurrentUserId UUID userId, @PathVariable UUID sessionId,
            @Valid @RequestBody AnswerRequest request) {
        return ApiResponse.ok(learnService.answer(userId, sessionId, request));
    }
}
