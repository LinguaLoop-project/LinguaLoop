package com.lingualoop.backend.vocab.service;

import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;

/**
 * Loại từ của thẻ (BR-NT-03, CHECK của {@code vocab_cards.pos}): mã lưu trong cơ sở dữ liệu kèm tên tiếng Việt hiển
 * thị trong tệp mẫu nhập thẻ (BR-NT-07).
 */
public final class CardPos {

    /** Mã loại từ hợp lệ, dùng cho {@code @Pattern}; khớp đúng danh sách {@link #VI_LABELS}. */
    public static final String REGEX = "noun|verb|adjective|adverb|preposition|pronoun|conjunction|determiner"
            + "|interjection|phrasal verb|idiom|phrase|collocation|modal verb";

    /** Mã loại từ theo thứ tự trong BR-NT-03, ánh xạ sang tên tiếng Việt. */
    public static final Map<String, String> VI_LABELS;

    static {
        Map<String, String> labels = new LinkedHashMap<>();
        labels.put("noun", "danh từ");
        labels.put("verb", "động từ");
        labels.put("adjective", "tính từ");
        labels.put("adverb", "trạng từ");
        labels.put("preposition", "giới từ");
        labels.put("pronoun", "đại từ");
        labels.put("conjunction", "liên từ");
        labels.put("determiner", "từ hạn định");
        labels.put("interjection", "thán từ");
        labels.put("phrasal verb", "cụm động từ");
        labels.put("idiom", "thành ngữ");
        labels.put("phrase", "cụm từ");
        labels.put("collocation", "kết hợp từ");
        labels.put("modal verb", "động từ khuyết thiếu");
        VI_LABELS = Map.copyOf(labels);
    }

    private CardPos() {
    }

    /**
     * Mã loại từ từ ô "Loại từ" của tệp nhập: nhận tên tiếng Việt hoặc mã tiếng Anh, không phân biệt hoa thường. Giá trị
     * không nhận ra được trả về nguyên văn để bước kiểm tra báo lỗi; ô trống trả về rỗng.
     */
    public static Optional<String> fromCell(String cell) {
        if (cell == null || cell.isBlank()) {
            return Optional.empty();
        }
        String key = cell.strip().replaceAll("\\s+", " ").toLowerCase(Locale.ROOT);
        if (VI_LABELS.containsKey(key)) {
            return Optional.of(key);
        }
        return Optional.of(VI_LABELS.entrySet().stream()
                .filter(e -> e.getValue().equals(key))
                .map(Map.Entry::getKey)
                .findFirst()
                .orElse(cell.strip()));
    }
}
