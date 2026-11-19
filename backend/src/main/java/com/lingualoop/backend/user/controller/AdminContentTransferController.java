package com.lingualoop.backend.user.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.user.dto.ContentTransferView;
import com.lingualoop.backend.user.dto.request.TransferSelectedRequest;
import com.lingualoop.backend.user.enums.TransferContentType;
import com.lingualoop.backend.user.service.ContentTransferService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** Danh sách nội dung cần giao và giao các mục đã chọn (UC-QT-05, UC-QT-06). Chỉ quản trị viên (BR-QT-01). */
@Validated
@RestController
@RequestMapping("/api/v1/admin/content-transfers")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminContentTransferController {

    private final ContentTransferService contentTransferService;

    /**
     * Nội dung cần giao, 20 mục mỗi trang (UC-QT-05, BR-QT-05). {@code owner} là id giáo viên hoặc {@code system} cho
     * bộ thẻ chưa gán chủ.
     */
    @GetMapping("/items")
    public ApiResponse<PageResponse<ContentTransferView.Item>> items(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) TransferContentType type,
            @RequestParam(required = false) String owner,
            @RequestParam(defaultValue = "0") @Min(0) int page) {
        return ApiResponse.ok(contentTransferService.listItems(q, type, owner, page));
    }

    /** Giáo viên đang giữ nội dung cần giao, cho bộ lọc theo giáo viên. */
    @GetMapping("/owners")
    public ApiResponse<List<ContentTransferView.Owner>> owners() {
        return ApiResponse.ok(contentTransferService.owners());
    }

    /** Giáo viên có thể nhận (BR-QT-06); {@code exclude} là các giáo viên đang giữ nội dung. */
    @GetMapping("/recipients")
    public ApiResponse<List<ContentTransferView.Recipient>> recipients(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) List<UUID> exclude) {
        return ApiResponse.ok(contentTransferService.recipients(q, exclude));
    }

    /** Giao các mục đã chọn cho một giáo viên, toàn bộ hoặc không (UC-QT-06, BR-QT-07). */
    @PostMapping("/selected")
    public ApiResponse<ContentTransferView.Result> transferSelected(@CurrentUserId UUID adminId,
            @Valid @RequestBody TransferSelectedRequest request) {
        return ApiResponse.ok(contentTransferService.transferSelected(adminId, request));
    }
}
