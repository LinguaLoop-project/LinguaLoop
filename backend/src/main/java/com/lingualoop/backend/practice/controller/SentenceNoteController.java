package com.lingualoop.backend.practice.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.practice.dto.SentenceNoteEntryView;
import com.lingualoop.backend.practice.dto.SentenceNoteView;
import com.lingualoop.backend.practice.dto.request.SaveNoteRequest;
import com.lingualoop.backend.practice.service.SentenceNoteService;
import com.lingualoop.backend.security.CurrentUserId;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Ghi chú riêng của người học cho từng câu. */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SentenceNoteController {

    private final SentenceNoteService noteService;

    /** Ghi chú của người dùng cho câu; data là null nếu chưa có. */
    @GetMapping("/sentences/{sentenceId}/note")
    public ApiResponse<SentenceNoteView> get(@CurrentUserId UUID userId, @PathVariable UUID sentenceId) {
        return ApiResponse.ok(noteService.find(userId, sentenceId).orElse(null));
    }

    @PutMapping("/sentences/{sentenceId}/note")
    public ApiResponse<SentenceNoteView> save(@CurrentUserId UUID userId, @PathVariable UUID sentenceId,
            @Valid @RequestBody SaveNoteRequest request) {
        return ApiResponse.ok(noteService.save(userId, sentenceId, request.content()));
    }

    @DeleteMapping("/sentences/{sentenceId}/note")
    public ApiResponse<Void> delete(@CurrentUserId UUID userId, @PathVariable UUID sentenceId) {
        noteService.delete(userId, sentenceId);
        return ApiResponse.ok(null);
    }

    @GetMapping("/notes")
    public ApiResponse<List<SentenceNoteEntryView>> list(@CurrentUserId UUID userId,
            @RequestParam(required = false) String lessonSlug) {
        return ApiResponse.ok(noteService.list(userId, lessonSlug));
    }
}
