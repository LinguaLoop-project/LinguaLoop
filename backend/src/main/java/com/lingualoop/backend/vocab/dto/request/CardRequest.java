package com.lingualoop.backend.vocab.dto.request;

import com.lingualoop.backend.vocab.service.CardPos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Nội dung một thẻ khi thêm, sửa hoặc nhập từ tệp (UC-NT-04, 05, 07; BR-NT-03). Mọi mục được cắt khoảng trắng hai đầu
 * trước khi kiểm: từ vựng và nghĩa tiếng Việt chỉ có khoảng trắng coi là trống; mục tùy chọn trống thành {@code null}.
 * {@code pos} là mã loại từ trong {@link CardPos}; hai cột phiên âm Anh-Anh và Anh-Mỹ là hai mục riêng.
 * <p>
 * Ảnh (BR-NT-03): {@code imageKey} là S3 key nhận từ {@code POST /api/v1/uploads/presign} (mục đích
 * {@code CARD_IMAGE}) sau khi đã tải ảnh lên; trống = giữ ảnh hiện có. {@code removeImage=true} = bỏ ảnh. Tệp nhập
 * không có ảnh (BR-NT-07) nên hai mục này trống. {@code removeImage} là {@code Boolean} vì Jackson 3 từ chối trường
 * primitive bị thiếu.
 */
public record CardRequest(
        @NotBlank @Size(max = 100) String word,
        @NotBlank @Size(max = 500) String meaningVi,
        @Size(max = 100) String ipaUk,
        @Size(max = 100) String ipaUs,
        @Pattern(regexp = CardPos.REGEX) String pos,
        @Size(max = 500) String definitionEn,
        @Size(max = 500) String definitionVi,
        @Size(max = 500) String exampleEn,
        @Size(max = 500) String exampleVi,
        String imageKey,
        Boolean removeImage) {

    /** Nội dung thẻ không kèm ảnh, dùng khi nhập từ tệp. */
    public CardRequest(String word, String meaningVi, String ipaUk, String ipaUs, String pos, String definitionEn,
            String definitionVi, String exampleEn, String exampleVi) {
        this(word, meaningVi, ipaUk, ipaUs, pos, definitionEn, definitionVi, exampleEn, exampleVi, null, false);
    }

    public CardRequest {
        imageKey = optional(imageKey);
        removeImage = Boolean.TRUE.equals(removeImage);
        word = word == null ? null : word.strip();
        meaningVi = meaningVi == null ? null : meaningVi.strip();
        ipaUk = optional(ipaUk);
        ipaUs = optional(ipaUs);
        pos = optional(pos);
        definitionEn = optional(definitionEn);
        definitionVi = optional(definitionVi);
        exampleEn = optional(exampleEn);
        exampleVi = optional(exampleVi);
    }

    private static String optional(String value) {
        if (value == null) {
            return null;
        }
        String stripped = value.strip();
        return stripped.isEmpty() ? null : stripped;
    }
}
