package com.lingualoop.backend.dictionary.dto;

/**
 * Âm thanh Anh-Anh và Anh-Mỹ của một từ (theo loại từ nếu từ đó đọc khác nhau theo loại từ) để chép vào thẻ. Đường dẫn
 * để nguyên dạng tương đối như trong từ điển; đổi sang URL bằng {@code DictionaryQueryService#resolveAudioUrl} khi hiển
 * thị. Một trong hai có thể trống.
 */
public record AudioSnapshot(String audioUk, String audioUs) {
}
