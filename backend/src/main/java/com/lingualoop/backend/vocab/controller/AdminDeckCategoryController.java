package com.lingualoop.backend.vocab.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.vocab.dto.request.CategoryNameRequest;
import com.lingualoop.backend.vocab.dto.response.AdminCategoryResponse;
import com.lingualoop.backend.vocab.service.AdminDeckCategoryService;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Quản lý danh mục bộ thẻ (UC-CD-04 đến 06). Danh sách còn dùng để quản trị viên lọc danh sách bộ (UC-BT-01): mỗi
 * phần tử vẫn có {@code id} và {@code name}.
 */
@RestController
@RequestMapping("/api/v1/admin/vocab/categories")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminDeckCategoryController {

    private final AdminDeckCategoryService service;

    @GetMapping
    public ApiResponse<List<AdminCategoryResponse>> list(@RequestParam(required = false) String q) {
        return ApiResponse.ok(service.list(q));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<AdminCategoryResponse> create(@CurrentUserId UUID adminId,
            @Valid @RequestBody CategoryNameRequest request) {
        return ApiResponse.ok(service.create(adminId, request));
    }

    @PutMapping("/{categoryId}")
    public ApiResponse<AdminCategoryResponse> rename(@CurrentUserId UUID adminId, @PathVariable UUID categoryId,
            @Valid @RequestBody CategoryNameRequest request) {
        return ApiResponse.ok(service.rename(adminId, categoryId, request));
    }
}
