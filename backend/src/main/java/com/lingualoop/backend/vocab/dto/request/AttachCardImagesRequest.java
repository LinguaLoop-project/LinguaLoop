package com.lingualoop.backend.vocab.dto.request;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

/**
 * Gắn ảnh hàng loạt cho thẻ của một nhóm (UC-NT-08, BR-NT-09). Frontend tải từng ảnh lên S3 (mục đích
 * {@code CARD_IMAGE}) rồi gửi key kèm tên tệp gốc; hệ thống ghép tên tệp (bỏ đuôi) với từ vựng của thẻ. Tối đa 100
 * ảnh mỗi lần gửi; nhiều hơn thì frontend chia thành nhiều lần.
 */
public record AttachCardImagesRequest(@NotEmpty @Size(max = 100) List<@Valid Item> items) {

    public AttachCardImagesRequest {
        items = items == null ? List.of() : List.copyOf(items);
    }

    /** Một ảnh đã tải lên: tên tệp gốc trên máy giáo viên (vd {@code sustain.jpg}) và S3 key. */
    public record Item(@NotBlank @Size(max = 255) String fileName, @NotBlank String imageKey) {
    }
}
