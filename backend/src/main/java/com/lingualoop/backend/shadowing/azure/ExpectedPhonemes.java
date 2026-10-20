package com.lingualoop.backend.shadowing.azure;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

/**
 * Âm mẫu của từng từ, tách từ phiên âm của câu, để ghép với các âm Azure nghe được. Azure chỉ trả âm nó nghe thấy
 * (không trả âm mẫu), nên muốn mẹo và video đi theo âm cần sửa thì phải tự có âm mẫu. Hàm thuần.
 */
public final class ExpectedPhonemes {

    /** Ký hiệu dài trước để khớp "tʃ", "iː"... trước "t", "i". */
    private static final List<String> SYMBOLS = AzurePhonemeMapper.IDENTICAL.stream()
            .sorted(Comparator.comparingInt(String::length).reversed()).toList();

    private ExpectedPhonemes() {
    }

    /**
     * @return âm mẫu theo từng từ của câu (phần tử null nếu từ đó có ký tự ngoài bảng phonemes, để không gán sai);
     *         null nếu số từ phiên âm không bằng số từ của câu
     */
    public static List<List<String>> ofSentence(String text, String ipa) {
        if (text == null || ipa == null || ipa.isBlank()) {
            return null;
        }
        String[] words = text.trim().split("\\s+");
        String[] parts = ipa.trim().split("\\s+");
        if (words.length != parts.length) {
            return null;
        }
        List<List<String>> result = new ArrayList<>(parts.length);
        for (String part : parts) {
            result.add(tokenize(part));
        }
        return result;
    }

    /** @return các âm của một từ, hoặc null nếu gặp ký tự không thuộc bảng phonemes */
    static List<String> tokenize(String ipaWord) {
        String s = ipaWord.replaceAll("[/ˈˌ.()]", "").replace('ɡ', 'g').replace('ɹ', 'r').replaceAll("[,;:!?]+$", "");
        List<String> out = new ArrayList<>();
        int i = 0;
        while (i < s.length()) {
            int at = i;
            String hit = SYMBOLS.stream().filter(sym -> s.startsWith(sym, at)).findFirst().orElse(null);
            if (hit == null) {
                return null;
            }
            out.add(hit);
            i += hit.length();
        }
        return out;
    }

    /**
     * Mẫu là giọng Anh còn Azure chấm giọng Mỹ, nên có cặp âm khác ký hiệu nhưng là cùng một cách đọc (hot: ɒ ở Anh, ɑː
     * ở Mỹ). Cặp như vậy không được hiện như lỗi: coi âm mẫu chính là âm nghe được.
     */
    public static String reconcile(String heard, String expected) {
        if (expected == null || heard == null) {
            return expected;
        }
        return "ɒ".equals(expected) && "ɑː".equals(heard) ? heard : expected;
    }

    /**
     * Ghép theo vị trí: chỉ khi số âm nghe được bằng số âm mẫu mới biết âm nào ứng với âm nào.
     * shortcut: không ghép khi lệch số âm (vd "car" giọng Anh /kɑː/ so với Mỹ k-ɑ-r), khi nào cần thì dùng căn chỉnh chuỗi.
     *
     * @return danh sách dài {@code heardCount}, phần tử null nếu không ghép được
     */
    public static List<String> align(List<String> expected, int heardCount) {
        List<String> out = new ArrayList<>(heardCount);
        boolean same = expected != null && expected.size() == heardCount;
        for (int i = 0; i < heardCount; i++) {
            out.add(same ? expected.get(i) : null);
        }
        return out;
    }
}
