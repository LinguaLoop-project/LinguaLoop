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
import org.springframework.security.access.prepost.PreAuthorize;
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
import com.lingualoop.backend.security.CurrentUserId;
import com.lingualoop.backend.vocab.dto.CardImagesView;
import com.lingualoop.backend.vocab.dto.CardImportView;
import com.lingualoop.backend.vocab.dto.DeckManageView;
import com.lingualoop.backend.vocab.dto.request.AttachCardImagesRequest;
import com.lingualoop.backend.vocab.dto.request.CardRequest;
import com.lingualoop.backend.vocab.dto.request.GroupRequest;
import com.lingualoop.backend.vocab.service.VocabDeckContentService;
import com.lingualoop.backend.vocab.service.VocabDeckContentService.TemplateFormat;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Nhóm thẻ và thẻ trong bộ của giáo viên (UC-NT-01 đến UC-NT-07). Chỉ giáo viên chủ bộ; quản trị viên không thao tác
 * trên nhóm thẻ và thẻ (BR-NT-01), nên lớp này chỉ nhận vai trò giáo viên.
 */
@RestController
@RequestMapping("/api/v1/teacher/vocab/decks")
@PreAuthorize("hasRole('TEACHER')")
@RequiredArgsConstructor
public class TeacherVocabContentController {

    private static final String GROUP = "/{deckId}/groups/{groupId}";
    private static final String CARDS = GROUP + "/cards";
    private static final String XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private final VocabDeckContentService contentService;

    /** Thêm nhóm thẻ trống vào cuối bộ (UC-NT-01). */
    @PostMapping("/{deckId}/groups")
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DeckManageView.Group> addGroup(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @Valid @RequestBody GroupRequest request) {
        return ApiResponse.ok(contentService.addGroup(userId, deckId, request));
    }

    /** Đổi tên nhóm thẻ (UC-NT-02). */
    @PutMapping(GROUP)
    public ApiResponse<DeckManageView.Group> renameGroup(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @PathVariable UUID groupId, @Valid @RequestBody GroupRequest request) {
        return ApiResponse.ok(contentService.renameGroup(userId, deckId, groupId, request));
    }

    /** Xóa nhóm thẻ cùng các thẻ của nhóm (UC-NT-03). */
    @DeleteMapping(GROUP)
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteGroup(@CurrentUserId UUID userId, @PathVariable UUID deckId, @PathVariable UUID groupId) {
        contentService.deleteGroup(userId, deckId, groupId);
    }

    /** Thêm thẻ vào cuối nhóm (UC-NT-04). */
    @PostMapping(CARDS)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<DeckManageView.Card> addCard(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @PathVariable UUID groupId, @Valid @RequestBody CardRequest request) {
        return ApiResponse.ok(contentService.addCard(userId, deckId, groupId, request));
    }

    /** Sửa thẻ (UC-NT-05). */
    @PutMapping(CARDS + "/{cardId}")
    public ApiResponse<DeckManageView.Card> updateCard(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @PathVariable UUID groupId, @PathVariable UUID cardId, @Valid @RequestBody CardRequest request) {
        return ApiResponse.ok(contentService.updateCard(userId, deckId, groupId, cardId, request));
    }

    /** Xóa thẻ (UC-NT-06). */
    @DeleteMapping(CARDS + "/{cardId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteCard(@CurrentUserId UUID userId, @PathVariable UUID deckId, @PathVariable UUID groupId,
            @PathVariable UUID cardId) {
        contentService.deleteCard(userId, deckId, groupId, cardId);
    }

    /**
     * Gắn ảnh hàng loạt (UC-NT-08): frontend tải từng ảnh lên S3 (mục đích {@code CARD_IMAGE}) rồi gửi tên tệp gốc kèm
     * key, tối đa 100 ảnh mỗi lần; ảnh được ghép với thẻ theo tên tệp.
     */
    @PostMapping(CARDS + "/images")
    public ApiResponse<CardImagesView.Result> attachImages(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @PathVariable UUID groupId, @Valid @RequestBody AttachCardImagesRequest request) {
        return ApiResponse.ok(contentService.attachImages(userId, deckId, groupId, request));
    }

    /** Kiểm tệp Excel/CSV (phần {@code file}) và trả số thẻ sẽ được thêm, chưa ghi gì (UC-NT-07 bước 7). */
    @PostMapping(path = CARDS + "/import/preview", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<CardImportView.Preview> previewImport(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @PathVariable UUID groupId, @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(contentService.previewImport(userId, deckId, groupId, file.getOriginalFilename(),
                bytesOf(file)));
    }

    /** Nhập mọi thẻ trong tệp vào cuối nhóm; có dòng lỗi thì không thêm thẻ nào (UC-NT-07 bước 9). */
    @PostMapping(path = CARDS + "/import", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ApiResponse<CardImportView.Result> importCards(@CurrentUserId UUID userId, @PathVariable UUID deckId,
            @PathVariable UUID groupId, @RequestPart("file") MultipartFile file) {
        return ApiResponse.ok(contentService.importCards(userId, deckId, groupId, file.getOriginalFilename(),
                bytesOf(file)));
    }

    /** Tệp mẫu nhập thẻ; {@code format}: {@code xlsx} (mặc định) hoặc {@code csv} (AC-NT-49). */
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
