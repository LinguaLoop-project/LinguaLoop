package com.lingualoop.backend.vocab.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.vocab.dto.SavedWordView;
import com.lingualoop.backend.vocab.dto.request.SaveWordRequest;
import com.lingualoop.backend.vocab.service.SavedWordService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** Từ đã lưu của học viên: mỗi dòng là một nghĩa của một mục từ, được ôn như một thẻ. */
@RestController
@RequestMapping("/api/v1/vocab/saved-words")
@RequiredArgsConstructor
public class SavedWordController {

    private final SavedWordService savedWordService;

    /** Mọi từ đã lưu, mới lưu trước. */
    @GetMapping
    public ApiResponse<List<SavedWordView>> list(@CurrentUserId UUID userId) {
        return ApiResponse.ok(savedWordService.list(userId));
    }

    /** Lưu một nghĩa; lưu lại nghĩa đã lưu thì trả bản hiện có. */
    @PutMapping
    public ApiResponse<SavedWordView> save(@CurrentUserId UUID userId, @Valid @RequestBody SaveWordRequest request) {
        return ApiResponse.ok(
                savedWordService.save(userId, request.headword(), request.meaningNo(), request.sentenceId()));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> unsave(@CurrentUserId UUID userId, @PathVariable UUID id) {
        savedWordService.unsave(userId, id);
        return ApiResponse.ok(null);
    }
}
