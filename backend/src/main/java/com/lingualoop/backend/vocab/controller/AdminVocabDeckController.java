package com.lingualoop.backend.vocab.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
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
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.DeckListQuery;
import com.lingualoop.backend.vocab.dto.request.DeckStatusFilter;
import com.lingualoop.backend.vocab.dto.request.UnpublishDeckRequest;
import com.lingualoop.backend.vocab.service.VocabDeckManageService;

import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/**
 * Bộ thẻ thư viện Đã xuất bản cho quản trị viên (BR-BT-01): danh sách, xem chi tiết và gỡ xuất bản (UC-BT-01, 04, 06).
 * Không có sửa, xóa, khôi phục (AC-BT-63).
 */
@RestController
@RequestMapping("/api/v1/admin/vocab/decks")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminVocabDeckController {

    private final VocabDeckManageService deckManageService;

    /**
     * Bộ Đã xuất bản của mọi giáo viên và bộ hệ thống, 10 bộ mỗi trang. {@code ownerId} lọc theo giáo viên chủ bộ,
     * {@code system=true} chỉ lấy bộ hệ thống. {@code status} Nháp hoặc Đã xóa trả 403 (AC-BT-61).
     */
    @GetMapping
    public ApiResponse<PageResponse<DeckManageView.AdminItem>> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) UUID categoryId,
            @RequestParam(defaultValue = "false") boolean other,
            @RequestParam(defaultValue = "false") boolean pro,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) UUID ownerId,
            @RequestParam(defaultValue = "false") boolean system,
            @RequestParam(defaultValue = "0") @Min(0) int page) {
        DeckListQuery query = new DeckListQuery(q, categoryId, other, pro, DeckStatusFilter.parse(status), ownerId,
                system);
        return ApiResponse.ok(deckManageService.listForAdmin(query, page));
    }

    /** Thông tin chung, chủ bộ và nhóm thẻ của bộ Đã xuất bản; bộ Nháp trả 403 (UC-BT-04, AC-BT-52). */
    @GetMapping("/{deckId}")
    public ApiResponse<DeckManageView.Detail> detail(@PathVariable UUID deckId) {
        return ApiResponse.ok(deckManageService.getForAdmin(deckId));
    }

    /** Thẻ của một nhóm, 20 thẻ mỗi trang theo thứ tự trong nhóm; {@code q} tìm theo từ vựng (BR-BT-15). */
    @GetMapping("/{deckId}/groups/{groupId}/cards")
    public ApiResponse<PageResponse<DeckManageView.Card>> cards(@PathVariable UUID deckId,
            @PathVariable UUID groupId,
            @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok(deckManageService.listCardsForAdmin(deckId, groupId, q, page));
    }

    /** Gỡ xuất bản kèm lý do bắt buộc; lý do hiện cho giáo viên chủ bộ (UC-BT-06, BR-BT-08). */
    @PostMapping("/{deckId}/unpublish")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void unpublish(@PathVariable UUID deckId, @RequestBody UnpublishDeckRequest request) {
        deckManageService.unpublishByAdmin(deckId, request);
    }
}
