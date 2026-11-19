package com.lingualoop.backend.vocab.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.vocab.dto.MyDeckView;
import com.lingualoop.backend.vocab.dto.request.MyDeckRequest;
import com.lingualoop.backend.vocab.service.MyDeckService;

import lombok.RequiredArgsConstructor;

/** "Bộ của tôi": bộ từ vựng cá nhân của học viên (UC-HT-08). */
@RestController
@RequestMapping("/api/v1/vocab/my-decks")
@RequiredArgsConstructor
public class MyDeckController {

    private final MyDeckService myDeckService;

    /** Bộ cá nhân chưa xóa của chính học viên, mới tạo trước. */
    @GetMapping
    public ApiResponse<List<MyDeckView>> list(@CurrentUserId UUID userId) {
        return ApiResponse.ok(myDeckService.list(userId));
    }

    /** Thêm bộ trống; tên trống hoặc quá 100 ký tự trả lỗi trên trường {@code name}, tên trùng trả 409 (BR-HT-25). */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<MyDeckView> create(@CurrentUserId UUID userId, @RequestBody MyDeckRequest request) {
        return ApiResponse.ok(myDeckService.create(userId, request.name()));
    }

    @PutMapping("/{deckId}")
    public ApiResponse<MyDeckView> rename(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @RequestBody MyDeckRequest request) {
        return ApiResponse.ok(myDeckService.rename(userId, deckId, request.name()));
    }

    /** Xóa tạm bộ; bộ không còn trong danh sách và thẻ của bộ rời hàng đợi ôn. */
    @DeleteMapping("/{deckId}")
    public ApiResponse<Void> delete(@CurrentUserId UUID userId, @PathVariable UUID deckId) {
        myDeckService.delete(userId, deckId);
        return ApiResponse.ok(null);
    }
}
