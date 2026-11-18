package com.lingualoop.backend.vocab.controller;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.UUID;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.common.response.ApiResponse;
import com.lingualoop.backend.common.response.PageResponse;
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.vocab.dto.CardImportView;
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.CardRequest;
import com.lingualoop.backend.vocab.dto.request.GroupRequest;
import com.lingualoop.backend.vocab.service.MyDeckContentService;
import com.lingualoop.backend.vocab.service.VocabDeckContentService.TemplateFormat;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Nhóm thẻ và thẻ trong "Bộ của tôi" (UC-HT-09). Cùng hình dạng với API nội dung bộ của giáo viên nhưng chỉ dành cho
 * học viên chủ bộ và không có ảnh.
 */
@RestController
@RequestMapping("/api/v1/vocab/my-decks")
@RequiredArgsConstructor
public class MyDeckContentController {

    private static final String DECK = "/{deckId}";
    private static final String GROUP = DECK + "/groups/{groupId}";
    private static final String CARDS = GROUP + "/cards";
    private static final String XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private final MyDeckContentService contentService;

    /** Thông tin chung và nhóm thẻ của bộ. */
    @GetMapping(DECK)
    public ApiResponse<DeckManageView.Detail> detail(@CurrentUserId UUID userId, @PathVariable UUID deckId) {
        return ApiResponse.ok(contentService.detail(userId, deckId));
    }

    /** Thẻ của một nhóm, 20 thẻ mỗi trang; {@code q} tìm theo từ vựng. */
    @GetMapping(CARDS)
    public ApiResponse<PageResponse<DeckManageView.Card>> cards(@CurrentUserId UUID userId,
            @PathVariable UUID deckId, @PathVariable UUID groupId, @RequestParam(required = false) String q,
            @RequestParam(defaultValue = "0") int page) {
        return ApiResponse.ok(contentService.cards(userId, deckId, groupId, q, page));
    }

    @PostMapping(DECK + "/groups")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DeckManageView.Group> addGroup(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @Valid @RequestBody GroupRequest request) {
        return ApiResponse.ok(contentService.addGroup(userId, deckId, request));
    }

    @PutMapping(GROUP)
    public ApiResponse<DeckManageView.Group> renameGroup(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @PathVariable UUID groupId, @Valid @RequestBody GroupRequest request) {
        return ApiResponse.ok(contentService.renameGroup(userId, deckId, groupId, request));
    }

    /** Xóa nhóm cùng các thẻ của nhóm. */
    @DeleteMapping(GROUP)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGroup(@CurrentUserId UUID userId, @PathVariable UUID deckId, @PathVariable UUID groupId) {
        contentService.deleteGroup(userId, deckId, groupId);
    }

    @PostMapping(CARDS)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DeckManageView.Card> addCard(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @PathVariable UUID groupId, @Valid @RequestBody CardRequest request) {
        return ApiResponse.ok(contentService.addCard(userId, deckId, groupId, request));
    }

    @PutMapping(CARDS + "/{cardId}")
    public ApiResponse<DeckManageView.Card> updateCard(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @PathVariable UUID groupId, @PathVariable UUID cardId, @Valid @RequestBody CardRequest request) {
        return ApiResponse.ok(contentService.updateCard(userId, deckId, groupId, cardId, request));
    }

    @DeleteMapping(CARDS + "/{cardId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCard(@CurrentUserId UUID userId, @PathVariable UUID deckId, @PathVariable UUID groupId,
            @PathVariable UUID cardId) {
        contentService.deleteCard(userId, deckId, groupId, cardId);
    }

    /** Kiểm tệp Excel/CSV (phần {@code file}) và trả số thẻ sẽ được thêm, chưa ghi gì. */
    @PostMapping(path = CARDS + "/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CardImportView.Preview> previewImport(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @PathVariable UUID groupId, @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(contentService.previewImport(userId, deckId, groupId, file.getOriginalFilename(),
                bytesOf(file)));
    }

    /** Nhập mọi thẻ trong tệp vào cuối nhóm; có dòng lỗi thì không thêm thẻ nào. */
    @PostMapping(path = CARDS + "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CardImportView.Result> importCards(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @PathVariable UUID groupId, @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(contentService.importCards(userId, deckId, groupId, file.getOriginalFilename(),
                bytesOf(file)));
    }

    /** Tệp mẫu nhập thẻ; {@code format}: {@code xlsx} (mặc định) hoặc {@code csv}. */
    @GetMapping("/card-import-template")
    public ResponseEntity<byte[]> importTemplate(@RequestParam(defaultValue = "xlsx") String format) {
        TemplateFormat parsed = switch (format.toLowerCase(Locale.ROOT)) {
            case "xlsx" -> TemplateFormat.XLSX;
            case "csv" -> TemplateFormat.CSV;
            default -> throw new BusinessException(ErrorCode.BAD_REQUEST, "format phải là xlsx hoặc csv");
        };
        String filename = "mau-nhap-the." + format.toLowerCase(Locale.ROOT);
        MediaType type = parsed == TemplateFormat.CSV ? new MediaType("text", "csv", StandardCharsets.UTF_8)
                : MediaType.parseMediaType(XLSX_TYPE);
        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION, ContentDisposition.attachment().filename(filename).build()
                        .toString())
                .body(contentService.importTemplate(parsed));
    }

    private static byte[] bytesOf(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }
}
