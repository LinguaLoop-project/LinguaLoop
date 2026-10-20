package com.lingualoop.backend.shadowing.azure;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

/**
 * Chuyển chuỗi âm vị IPA giọng Mỹ của Azure (en-US) sang ký hiệu của bảng {@code phonemes} (44 âm Anh-Anh).
 * Xem ADR 0004. Hàm thuần, duyệt cả chuỗi âm của một từ vì có quy tắc theo âm đứng sau.
 */
public final class AzurePhonemeMapper {

    /** Chuyển một ký hiệu, không xét ngữ cảnh. Phụ âm giống nhau ở hai bảng nên không cần liệt kê (xem {@link #IDENTICAL}). */
    private static final Map<String, String> SINGLE = Map.ofEntries(
            Map.entry("ɡ", "g"),
            Map.entry("ɹ", "r"),
            Map.entry("i", "iː"),
            Map.entry("ɛ", "e"),
            Map.entry("ɑ", "ɑː"),
            Map.entry("ɔ", "ɔː"),
            Map.entry("u", "uː"),
            Map.entry("ɝ", "ɜː"),
            Map.entry("ɜ", "ɜː"),
            Map.entry("ɚ", "ə"),
            Map.entry("oʊ", "əʊ"));

    /** Ký hiệu đã có sẵn trong bảng {@code phonemes}, giữ nguyên. */
    static final List<String> IDENTICAL = List.of(
            "p", "b", "t", "d", "k", "g", "f", "v", "θ", "ð", "s", "z", "ʃ", "ʒ", "h", "tʃ", "dʒ",
            "m", "n", "ŋ", "l", "r", "j", "w",
            "iː", "ɪ", "e", "æ", "ʌ", "ɑː", "ɒ", "ɔː", "ʊ", "uː", "ɜː", "ə",
            "eɪ", "aɪ", "ɔɪ", "aʊ", "əʊ", "ɪə", "eə", "ʊə");

    /** Nguyên âm đứng ngay trước {@code ɹ} thành nguyên âm đôi tương ứng (near, square, cure). */
    private static final Map<String, String> BEFORE_R = Map.of(
            "ɪ", "ɪə",
            "e", "eə",
            "ʊ", "ʊə");

    private AzurePhonemeMapper() {
    }

    /**
     * @return danh sách cùng độ dài với đầu vào; phần tử là ký hiệu trong bảng {@code phonemes}, hoặc
     *         {@code null} nếu không chuyển được (giữ vị trí để không lệch thứ tự âm trong từ)
     */
    public static List<String> toTableSymbols(List<String> azureSymbols) {
        List<String> normalized = azureSymbols.stream().map(AzurePhonemeMapper::normalize).toList();
        List<String> result = new ArrayList<>(normalized.size());
        for (int i = 0; i < normalized.size(); i++) {
            String symbol = convert(normalized.get(i));
            boolean beforeR = i + 1 < normalized.size() && isR(normalized.get(i + 1));
            if (symbol != null && beforeR && BEFORE_R.containsKey(symbol)) {
                symbol = BEFORE_R.get(symbol);
            }
            result.add(symbol);
        }
        return result;
    }

    private static String convert(String symbol) {
        String mapped = SINGLE.get(symbol);
        if (mapped != null) {
            return mapped;
        }
        if (IDENTICAL.contains(symbol)) {
            return symbol;
        }
        return convertRColoured(symbol);
    }

    /**
     * Azure còn trả nguyên âm kèm r thành MỘT âm (vd "ɔɹ" trong "morning", "ɪɹ" trong "near"). Chuyển theo nguyên
     * âm: "ɔɹ"→ɔː, "ɑɹ"→ɑː, "ɪɹ"→ɪə, "ɛɹ"→eə, "ʊɹ"→ʊə. Âm r đã nằm trong âm gộp nên không tách riêng.
     */
    private static String convertRColoured(String symbol) {
        if (symbol.length() < 2 || !isR(symbol.substring(symbol.length() - 1))) {
            return null;
        }
        String vowel = convert(symbol.substring(0, symbol.length() - 1));
        return vowel == null ? null : BEFORE_R.getOrDefault(vowel, vowel);
    }

    private static boolean isR(String symbol) {
        return "ɹ".equals(symbol) || "r".equals(symbol);
    }

    /** Bỏ dấu trọng âm và khoảng trắng mà Azure đôi khi kèm theo. */
    private static String normalize(String symbol) {
        return symbol == null ? "" : symbol.replace("ˈ", "").replace("ˌ", "").trim();
    }
}
