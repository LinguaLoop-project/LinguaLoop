package com.lingualoop.backend.vocab.dto;

import java.util.List;
import java.util.UUID;

/** Kết quả gắn ảnh hàng loạt cho thẻ của một nhóm (UC-NT-08, BR-NT-09). */
public final class CardImagesView {

    private CardImagesView() {
    }

    /**
     * {@code attached}: ảnh đã gắn vào thẻ (thay ảnh cũ nếu có). {@code unmatched}: tên tệp không khớp từ vựng nào của
     * nhóm. {@code duplicated}: tệp khớp một thẻ đã được tệp khác trong cùng lần gửi gắn ảnh. {@code invalid}: tệp
     * không phải JPG/PNG thật hoặc chưa tải lên được. Mọi ảnh không được gắn đều bị bỏ khỏi kho tệp.
     */
    public record Result(List<Attached> attached, List<String> unmatched, List<String> duplicated,
            List<String> invalid) {

        public Result {
            attached = List.copyOf(attached);
            unmatched = List.copyOf(unmatched);
            duplicated = List.copyOf(duplicated);
            invalid = List.copyOf(invalid);
        }
    }

    public record Attached(UUID cardId, String word, String fileName) {
    }
}
