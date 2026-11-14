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

/** Danh mục để giáo viên lọc danh sách bộ và chọn khi tạo, sửa bộ (UC-BT-01, UC-BT-02, BR-BT-14). */
@RestController
@RequestMapping("/api/v1/teacher/vocab/categories")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
public class TeacherDeckCategoryController {

    private final VocabDeckManageService deckManageService;

    @GetMapping
    public ApiResponse<List<DeckManageView.Category>> list() {
        return ApiResponse.ok(deckManageService.listCategories());
    }
}
