package com.lingualoop.backend.lesson.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
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
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.lesson.dto.LessonManageView;
import com.lingualoop.backend.lesson.dto.request.CreateLessonFromYouTubeRequest;
import com.lingualoop.backend.lesson.dto.request.RestoreLessonRequest;
import com.lingualoop.backend.lesson.dto.request.SuggestSentencesRequest;
import com.lingualoop.backend.lesson.dto.request.UpdateLessonRequest;
import com.lingualoop.backend.lesson.dto.request.UpdateSentencesRequest;
import com.lingualoop.backend.lesson.dto.response.CreatedLessonResponse;
import com.lingualoop.backend.lesson.dto.response.SentenceSuggestionResponse;
import com.lingualoop.backend.lesson.dto.response.YouTubePreviewResponse;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import com.lingualoop.backend.lesson.service.LessonManageService;
import com.lingualoop.backend.lesson.service.LessonManageService.ListQuery;
import com.lingualoop.backend.lesson.service.LessonSuggestionService;
import com.lingualoop.backend.lesson.service.TeacherLessonImportService;
import com.lingualoop.backend.security.CurrentUserId;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/**
 * Bài học của giáo viên (UC-BH-01 đến UC-BH-10). {@code SecurityConfig} cho cả quản trị viên vào {@code /teacher/**},
 * nên lớp này chỉ nhận giáo viên: quản trị viên không thêm, sửa, xuất bản, xóa hay khôi phục bài (BR-BH-02).
 */
@Validated
@RestController
@RequestMapping("/api/v1/teacher/lessons")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
public class TeacherLessonController {

    private final TeacherLessonImportService importService;
    private final LessonManageService manageService;
    private final LessonSuggestionService suggestionService;

    /** Bài của chính giáo viên, 10 bài mỗi trang, mới cập nhật trước; {@code status}: all, published, draft, deleted. */
    @GetMapping
    public ApiResponse<PageResponse<LessonManageView.Item>> list(@CurrentUserId UUID teacherId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID topicId,
            @RequestParam(required = false) CefrLevel cefrLevel,
            @RequestParam(defaultValue = "false") boolean pro,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok(manageService.listForTeacher(teacherId,
                new ListQuery(q, topicId, cefrLevel, pro, status, null), page));
    }

    /**
     * Tạo bài Nháp từ link YouTube (UC-BH-03). Lời thoại lấy từ phụ đề tiếng Anh của video qua TranscriptAPI (ADR 0012);
     * bản dịch để trống.
     */
    @PostMapping("/youtube")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CreatedLessonResponse> createFromYouTube(@CurrentUserId UUID teacherId,
            @Valid @RequestBody CreateLessonFromYouTubeRequest request) {
        return ApiResponse.ok(importService.createFromYouTube(teacherId, request));
    }

    /** Ảnh, tên và thời lượng video khi giáo viên dán link, trước khi chọn chủ đề, trình độ rồi tạo (UC-BH-03). */
    @GetMapping("/youtube/preview")
    public ApiResponse<YouTubePreviewResponse> previewYouTube(@CurrentUserId UUID teacherId, @RequestParam String url) {
        return ApiResponse.ok(importService.previewYouTube(teacherId, url));
    }

    /** Thông tin bài và các câu theo thứ tự (UC-BH-02). */
    @GetMapping("/{lessonId}")
    public ApiResponse<LessonManageView.Detail> detail(@CurrentUserId UUID teacherId, @PathVariable UUID lessonId) {
        return ApiResponse.ok(manageService.getForTeacher(teacherId, lessonId));
    }

    /** Sửa tiêu đề, chủ đề, trình độ, nhãn Pro (UC-BH-04). */
    @PutMapping("/{lessonId}")
    public ApiResponse<LessonManageView.Detail> update(@CurrentUserId UUID teacherId, @PathVariable UUID lessonId,
            @RequestBody UpdateLessonRequest request) {
        return ApiResponse.ok(manageService.updateInfo(teacherId, lessonId, request));
    }

    /** Lưu các câu đã sửa và xóa các câu được chọn (UC-BH-05). */
    @PutMapping("/{lessonId}/sentences")
    public ApiResponse<LessonManageView.Detail> updateSentences(@CurrentUserId UUID teacherId,
            @PathVariable UUID lessonId, @RequestBody UpdateSentencesRequest request) {
        return ApiResponse.ok(manageService.updateSentences(teacherId, lessonId, request));
    }

    /** Gợi ý bản dịch và IPA cho các câu, chưa lưu (UC-BH-10). */
    @PostMapping("/{lessonId}/suggestions")
    public ApiResponse<SentenceSuggestionResponse> suggest(@CurrentUserId UUID teacherId,
            @PathVariable UUID lessonId, @Valid @RequestBody SuggestSentencesRequest request) {
        return ApiResponse.ok(suggestionService.suggest(teacherId, lessonId, request));
    }

    /** Xuất bản bài Nháp (UC-BH-06). */
    @PostMapping("/{lessonId}/publish")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void publish(@CurrentUserId UUID teacherId, @PathVariable UUID lessonId) {
        manageService.publish(teacherId, lessonId);
    }

    /** Gỡ xuất bản bài của mình về Nháp, không cần lý do (UC-BH-07). */
    @PostMapping("/{lessonId}/unpublish")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unpublish(@CurrentUserId UUID teacherId, @PathVariable UUID lessonId) {
        manageService.unpublishByTeacher(teacherId, lessonId);
    }

    /** Xóa tạm bài, giữ 30 ngày để khôi phục (UC-BH-08). */
    @DeleteMapping("/{lessonId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUserId UUID teacherId, @PathVariable UUID lessonId) {
        manageService.delete(teacherId, lessonId);
    }

    /** Khôi phục bài đã xóa về Nháp; body có {@code title} khi tiêu đề cũ đã bị trùng (UC-BH-09 luồng 6a). */
    @PostMapping("/{lessonId}/restore")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restore(@CurrentUserId UUID teacherId, @PathVariable UUID lessonId,
            @RequestBody(required = false) RestoreLessonRequest request) {
        manageService.restore(teacherId, lessonId, request);
    }
}
