package com.lingualoop.backend.shadowing.azure;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Chuyển chuỗi âm vị IPA giọng Mỹ của Azure (en-US) sang ký hiệu của bảng {@code phonemes}, cũng là 44 âm giọng Mỹ
 * (ADR 0007). Hầu hết ký hiệu giống hệt nhau; việc còn lại là chuẩn hoá các cách viết khác nhau của cùng một âm và
 * gộp âm r. Hàm thuần, duyệt cả chuỗi âm của một từ vì có quy tắc theo âm đứng sau.
 */
public final class AzurePhonemeMapper {

    /** Cách viết khác của cùng một âm (Azure và phiên âm trả cả g lẫn ɡ; r, ɜ viết giản lược). */
    static final Map<String, String> SINGLE = Map.of(
            "ɡ", "g",
            "r", "ɹ",
            "ɜ", "ɝ");

    /** Ký hiệu của bảng {@code phonemes}, giữ nguyên. */
    static final List<String> IDENTICAL = List.of(
            "p", "b", "t", "d", "k", "g", "f", "v", "θ", "ð", "s", "z", "ʃ", "ʒ", "h", "tʃ", "dʒ",
            "m", "n", "ŋ", "l", "ɹ", "j", "w",
            "i", "ɪ", "ɛ", "æ", "ʌ", "ɑ", "ɔ", "ʊ", "u", "ɝ", "ə", "ɚ",
            "eɪ", "aɪ", "ɔɪ", "aʊ", "oʊ",
            "ɪɹ", "ɛɹ", "ʊɹ");

    /**
     * Ba nguyên âm có hàng riêng khi đi cùng ɹ. Phiên âm câu được tách thành nguyên âm + ɹ rồi mới gộp theo cách
     * Azure chia âm (xem {@link ExpectedPhonemes}), nên các ký hiệu này không tự tách ra ở đó.
     */
    static final Set<String> R_COLOURED = Set.of("ɪɹ", "ɛɹ", "ʊɹ");

    /** Nguyên âm đứng ngay trước {@code ɹ} thành âm r-hoá tương ứng (near, square, cure). */
    private static final Map<String, String> BEFORE_R = Map.of(
            "ɪ", "ɪɹ",
            "ɛ", "ɛɹ",
            "ʊ", "ʊɹ");

    private AzurePhonemeMapper() {
    }

    /** Mọi ký hiệu mà {@link #toTableSymbols} có thể trả ra; phải khớp từng hàng của bảng {@code phonemes}. */
    public static List<String> tableSymbols() {
        return IDENTICAL;
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
     * Azure còn trả nguyên âm kèm r thành MỘT âm (vd "ɔɹ" trong "morning", "ɑɹ" trong "car"). Âm có hàng riêng
     * (ɪɹ, ɛɹ, ʊɹ) được giữ nguyên ở {@link #convert}; ɔɹ và ɑɹ chuyển theo nguyên âm (ɔ, ɑ). Âm r đã nằm trong âm
     * gộp nên không tách riêng.
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
