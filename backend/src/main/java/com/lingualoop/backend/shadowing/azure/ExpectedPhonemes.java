package com.lingualoop.backend.shadowing.azure;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

/**
 * Âm mẫu của từng từ, tách từ phiên âm của câu, để ghép với các âm Azure nghe được. Azure chỉ trả âm nó nghe thấy
 * (không trả âm mẫu), nên muốn mẹo và video đi theo âm cần sửa thì phải tự có âm mẫu. Hàm thuần.
 */
public final class ExpectedPhonemes {

    /**
     * Ký hiệu của phiên âm câu (giọng Mỹ, cùng hệ với Azure en-US, ADR 0004), ký hiệu dài trước để khớp "tʃ", "oʊ"...
     * trước "t", "o".
     */
    private static final List<String> SYMBOLS = Stream.concat(
                    AzurePhonemeMapper.IDENTICAL.stream(), AzurePhonemeMapper.SINGLE.keySet().stream())
            .distinct().sorted(Comparator.comparingInt(String::length).reversed()).toList();

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

    /** @return các âm của một từ theo bảng phonemes, hoặc null nếu gặp ký tự lạ */
    static List<String> tokenize(String ipaWord) {
        String s = ipaWord.replaceAll("[/ˈˌ.()]", "").replaceAll("[,;:!?]+$", "");
        List<String> raw = new ArrayList<>();
        int i = 0;
        while (i < s.length()) {
            int at = i;
            String hit = SYMBOLS.stream().filter(sym -> s.startsWith(sym, at)).findFirst().orElse(null);
            if (hit == null) {
                return null;
            }
            raw.add(hit);
            i += hit.length();
        }
        // Cùng bộ chuyển đổi với âm Azure trả về nên hai bên so được với nhau
        List<String> out = AzurePhonemeMapper.toTableSymbols(raw);
        return out.contains(null) ? null : out;
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
