package com.lingualoop.backend.vocab.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.CreateDeckRequest;
import com.lingualoop.backend.vocab.dto.request.DeckListQuery;
import com.lingualoop.backend.vocab.dto.request.DeckStatusFilter;
import com.lingualoop.backend.vocab.dto.request.RestoreDeckRequest;
import com.lingualoop.backend.vocab.dto.request.UpdateDeckRequest;
import com.lingualoop.backend.vocab.service.VocabDeckManageService;

import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/**
 * Bộ thẻ của giáo viên (UC-BT-01 đến UC-BT-08). {@code SecurityConfig} cho cả quản trị viên vào {@code /teacher/**}, nên
 * lớp này chỉ nhận giáo viên: quản trị viên không thêm, sửa, xóa hay khôi phục bộ thẻ (BR-BT-01, AC-BT-63).
 */
@RestController
@RequestMapping("/api/v1/teacher/vocab/decks")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
public class TeacherVocabDeckController {

    private final VocabDeckManageService deckManageService;

    /** Bộ của chính giáo viên, 10 bộ mỗi trang, mới cập nhật trước; {@code status}: all, published, draft, deleted. */
    @GetMapping
    public ApiResponse<PageResponse<DeckManageView.Item>> list(@CurrentUserId UUID userId,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(defaultValue = "false") boolean other,
            @RequestParam(defaultValue = "false") boolean pro,
            @RequestParam(required = false) String status,
            @RequestParam(defaultValue = "0") @Min(0) int page) {
        DeckListQuery query = new DeckListQuery(q, categoryId, other, pro, DeckStatusFilter.parse(status), null, false);
        return ApiResponse.ok(deckManageService.listForTeacher(userId, query, page));
    }

    /**
     * Tạo bộ Nháp. Ảnh (JPG/PNG tối đa 2 MB) không bắt buộc: frontend tải ảnh thẳng lên S3 qua
     * {@code POST /api/v1/uploads/presign} (mục đích {@code DECK_IMAGE}) rồi gửi {@code imageKey} ở đây.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DeckManageView.Item> create(@CurrentUserId UUID userId, @RequestBody CreateDeckRequest request) {
        return ApiResponse.ok(deckManageService.createDeck(userId, request));
    }

    /** Thông tin chung và nhóm thẻ của một bộ chưa xóa của giáo viên (UC-BT-04). */
    @GetMapping("/{deckId}")
    public ApiResponse<DeckManageView.Detail> detail(@CurrentUserId UUID userId, @PathVariable UUID deckId) {
        return ApiResponse.ok(deckManageService.getForTeacher(userId, deckId));
    }

    /** Thẻ của một nhóm, 20 thẻ mỗi trang theo thứ tự trong nhóm; {@code q} tìm theo từ vựng (BR-BT-15). */
    @GetMapping("/{deckId}/groups/{groupId}/cards")
    public ApiResponse<PageResponse<DeckManageView.Card>> cards(@CurrentUserId UUID userId,
            @PathVariable UUID deckId, @PathVariable UUID groupId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok(deckManageService.listCardsForTeacher(userId, deckId, groupId, q, page));
    }

    /**
     * Sửa tên, ảnh, danh mục, yêu cầu Pro (UC-BT-03). Ảnh mới tải lên như khi tạo bộ rồi gửi {@code imageKey};
     * {@code removeImage=true} đưa về ảnh mặc định.
     */
    @PutMapping("/{deckId}")
    public ApiResponse<DeckManageView.Detail> update(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @RequestBody UpdateDeckRequest request) {
        return ApiResponse.ok(deckManageService.updateDeck(userId, deckId, request));
    }

    /** Xuất bản bộ Nháp (UC-BT-05). */
    @PostMapping("/{deckId}/publish")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void publish(@CurrentUserId UUID userId, @PathVariable UUID deckId) {
        deckManageService.publish(userId, deckId);
    }

    /** Gỡ xuất bản bộ của mình về Nháp, không cần lý do (UC-BT-06). */
    @PostMapping("/{deckId}/unpublish")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unpublish(@CurrentUserId UUID userId, @PathVariable UUID deckId) {
        deckManageService.unpublishByTeacher(userId, deckId);
    }

    /** Xóa tạm bộ, giữ 30 ngày để khôi phục (UC-BT-07). */
    @DeleteMapping("/{deckId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@CurrentUserId UUID userId, @PathVariable UUID deckId) {
        deckManageService.deleteDeck(userId, deckId);
    }

    /** Khôi phục bộ đã xóa về Nháp; body có {@code name} khi tên cũ đã bị trùng (UC-BT-08 luồng 6a). */
    @PostMapping("/{deckId}/restore")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restore(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @RequestBody(required = false) RestoreDeckRequest request) {
        deckManageService.restoreDeck(userId, deckId, request);
    }
}
