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
import com.lingualoop.backend.lesson.enums.PracticeMode;
import com.lingualoop.backend.practice.dto.SentenceNoteEntryView;
import com.lingualoop.backend.practice.dto.SentenceNoteView;
import com.lingualoop.backend.practice.dto.request.SaveNoteRequest;
import com.lingualoop.backend.practice.service.SentenceNoteService;
import com.lingualoop.backend.security.CurrentUserId;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Ghi chú riêng của người học cho từng câu; mỗi chế độ ({@code dictation}, {@code shadowing}) có ghi chú riêng. */
@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class SentenceNoteController {

    private final SentenceNoteService noteService;

    /** Ghi chú của người dùng cho câu ở một chế độ; data là null nếu chưa có. */
    @GetMapping("/sentences/{sentenceId}/notes/{mode}")
    public ApiResponse<SentenceNoteView> get(@CurrentUserId UUID userId, @PathVariable UUID sentenceId,
            @PathVariable PracticeMode mode) {
        return ApiResponse.ok(noteService.find(userId, sentenceId, mode).orElse(null));
    }

    @PutMapping("/sentences/{sentenceId}/notes/{mode}")
    public ApiResponse<SentenceNoteView> save(@CurrentUserId UUID userId, @PathVariable UUID sentenceId,
            @PathVariable PracticeMode mode, @Valid @RequestBody SaveNoteRequest request) {
        return ApiResponse.ok(noteService.save(userId, sentenceId, mode, request.content()));
    }

    @DeleteMapping("/sentences/{sentenceId}/notes/{mode}")
    public ApiResponse<Void> delete(@CurrentUserId UUID userId, @PathVariable UUID sentenceId,
            @PathVariable PracticeMode mode) {
        noteService.delete(userId, sentenceId, mode);
        return ApiResponse.ok(null);
    }

    /** Mọi ghi chú của người dùng; lọc theo chế độ và/hoặc bài khi truyền {@code mode}, {@code lessonId}. */
    @GetMapping("/notes")
    public ApiResponse<List<SentenceNoteEntryView>> list(@CurrentUserId UUID userId,
            @RequestParam(required = false) PracticeMode mode, @RequestParam(required = false) UUID lessonId) {
        return ApiResponse.ok(noteService.list(userId, mode, lessonId));
    }
}
