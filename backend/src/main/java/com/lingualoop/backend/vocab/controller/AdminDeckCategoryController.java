package com.lingualoop.backend.vocab.controller;

import java.util.List;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.service.VocabDeckManageService;

import lombok.RequiredArgsConstructor;

/**
 * Danh mục để quản trị viên lọc danh sách bộ (UC-BT-01). Xem kèm số bộ, thêm và sửa tên danh mục (UC-CD-04, 05, 06)
 * sẽ bổ sung ở đây.
 */
@RestController
@RequestMapping("/api/v1/admin/vocab/categories")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDeckCategoryController {

    private final VocabDeckManageService deckManageService;

    @GetMapping
    public ApiResponse<List<DeckManageView.Category>> list() {
        return ApiResponse.ok(deckManageService.listCategories());
    }
}
