package com.lingualoop.backend.vocab.controller;

import java.util.UUID;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.vocab.dto.DeckView;
import com.lingualoop.backend.vocab.service.VocabDeckService;

import lombok.RequiredArgsConstructor;

/** Bộ từ hệ thống và tiến độ của học viên. */
@RestController
@RequestMapping("/api/v1/vocab/decks")
@RequiredArgsConstructor
public class VocabDeckController {

    private final VocabDeckService deckService;

    /** Mọi bộ hệ thống kèm tiến độ của người học, và số thẻ theo trạng thái trên mọi bộ. */
    @GetMapping
    public ApiResponse<DeckView.ListResult> list(@CurrentUserId UUID userId) {
        return ApiResponse.ok(deckService.list(userId));
    }

    /** Một bộ: các phần kèm tiến độ (phần bị khoá với gói Free của bộ Pro) và vài từ mẫu. */
    @GetMapping("/{deckId}")
    public ApiResponse<DeckView.Detail> detail(@CurrentUserId UUID userId, @PathVariable UUID deckId) {
        return ApiResponse.ok(deckService.detail(userId, deckId));
    }
}
