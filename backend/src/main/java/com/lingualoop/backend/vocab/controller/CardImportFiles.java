package com.lingualoop.backend.vocab.controller;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.util.Locale;
import java.util.function.Function;

import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.multipart.MultipartFile;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.vocab.service.VocabDeckContentService.TemplateFormat;

/** Phần HTTP dùng chung của các API nhập thẻ từ tệp: đọc tệp tải lên và trả tệp mẫu. */
final class CardImportFiles {

    private static final String XLSX_TYPE = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";

    private CardImportFiles() {
    }

    static byte[] bytesOf(MultipartFile file) {
        try {
            return file.getBytes();
        } catch (IOException ex) {
            throw new UncheckedIOException(ex);
        }
    }

    /** Tệp mẫu nhập thẻ; {@code format}: {@code xlsx} hoặc {@code csv}, khác thì 400. */
    static ResponseEntity<byte[]> template(String format, Function<TemplateFormat, byte[]> source) {
        String lower = format.toLowerCase(Locale.ROOT);
        TemplateFormat parsed = switch (lower) {
            case "xlsx" -> TemplateFormat.XLSX;
            case "csv" -> TemplateFormat.CSV;
            default -> throw new BusinessException(ErrorCode.BAD_REQUEST, "format phải là xlsx hoặc csv");
        };
        MediaType type = parsed == TemplateFormat.CSV ? new MediaType("text", "csv", StandardCharsets.UTF_8)
                : MediaType.parseMediaType(XLSX_TYPE);
        return ResponseEntity.ok()
                .contentType(type)
                .header(HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment().filename("mau-nhap-the." + lower).build().toString())
                .body(source.apply(parsed));
    }
}
