package com.lingualoop.backend.lesson.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.lesson.dto.LessonManageView;
import com.lingualoop.backend.lesson.dto.request.UnpublishLessonRequest;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import com.lingualoop.backend.lesson.service.LessonManageService;
import com.lingualoop.backend.lesson.service.LessonManageService.ListQuery;
import com.lingualoop.backend.security.CurrentUserId;

import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/**
 * Bài học Đã xuất bản cho quản trị viên (BR-BH-02): danh sách, xem chi tiết và gỡ xuất bản kèm lý do (UC-BH-01, 02,
 * 07). Không có thêm, sửa, xuất bản, xóa, khôi phục.
 */
@Validated
@RestController
@RequestMapping("/api/v1/admin/lessons")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminLessonController {

    private final LessonManageService manageService;

    /** Bài Đã xuất bản của mọi giáo viên, 10 bài mỗi trang; {@code ownerId} lọc theo giáo viên chủ bài (AC-BH-82). */
    @GetMapping
    public ApiResponse<PageResponse<LessonManageView.Item>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID topicId,
            @RequestParam(required = false) CefrLevel cefrLevel,
            @RequestParam(defaultValue = "false") boolean pro,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID ownerId,
            @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok(manageService.listForAdmin(new ListQuery(q, topicId, cefrLevel, pro, status, ownerId),
                page));
    }

    /** Chi tiết bài Đã xuất bản; bài Nháp trả 403 (AC-BH-10). */
    @GetMapping("/{lessonId}")
    public ApiResponse<LessonManageView.Detail> detail(@PathVariable UUID lessonId) {
        return ApiResponse.ok(manageService.getForAdmin(lessonId));
    }

    /** Gỡ xuất bản kèm lý do bắt buộc; lý do hiện cho giáo viên chủ bài (UC-BH-07 luồng 2a, BR-BH-04). */
    @PostMapping("/{lessonId}/unpublish")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unpublish(@CurrentUserId UUID adminId, @PathVariable UUID lessonId,
            @RequestBody UnpublishLessonRequest request) {
        manageService.unpublishByAdmin(adminId, lessonId, request);
    }
}
