package com.lingualoop.backend.lesson.ipa;

import java.util.List;
import java.util.regex.Pattern;

/**
 * Đưa phiên âm của espeak-ng về định dạng lưu trong {@code sentences} (ADR 0007): mỗi token một cụm, không khoảng trắng,
 * dấu trọng âm ở đầu âm tiết và bỏ ở từ một âm tiết.
 * <ul>
 * <li>{@link #normalize}: giọng Mỹ ({@code -v en-us}) về bảng ký hiệu mà shadowing đọc được ({@code ExpectedPhonemes},
 * cùng hệ với Azure en-US). Đổi gần đúng nên có thể lệch Azure ở vài từ: {@code ɾ} và {@code ʔ} (âm t nuốt) đều thành
 * {@code t}.</li>
 * <li>{@link #normalizeUk}: giọng Anh ({@code -v en-gb}) chỉ để hiển thị, theo đúng kiểu ký hiệu của cột {@code ipa_uk}
 * trong seed: {@code r}, {@code g}, {@code e} thay cho {@code ɹ}, {@code ɡ}, {@code ɛ}; giữ dấu dài và {@code ɒ}.</li>
 * </ul>
 * Chỉ đổi những ký hiệu thật sự gặp trong đầu ra của espeak-ng (xem {@code IpaNormalizerTest}).
 */
public final class IpaNormalizer {

    private static final String VOWEL_CHARS = "aeiouæɑɒɔəɚɛɜɝɪʊʌː";

    private static final Pattern NUCLEUS_US = Pattern.compile("aɪ|aʊ|eɪ|oʊ|ɔɪ|[aeiouæɑɒɔəɚɛɜɝɪʊʌ]ː?");

    /** Nguyên âm đôi của giọng Anh trong seed; {@code iə} không tính là một (seed ghi {@code ˈhiə} có trọng âm). */
    private static final Pattern NUCLEUS_UK = Pattern.compile("aɪ|aʊ|eɪ|ɔɪ|əʊ|eə|ɪə|ʊə|[aeiouæɑɒɔəɜɪʊʌ]ː?");

    /** Ký tự có trong cột {@code ipa_uk} của seed (26.039 câu); ký tự khác nghĩa là espeak đọc lạ, bỏ cả câu. */
    private static final String UK_SYMBOLS = "abdefghijklmnprstuvwzæðŋɑɒɔəɜɪʃʊʌʒˈˌːθ";

    /** Cụm phụ âm được đứng đầu âm tiết tiếng Anh, dài trước. */
    private static final List<String> ONSETS_US = List.of(
            "stɹ", "spɹ", "skɹ", "spl", "skw",
            "pl", "pɹ", "bl", "bɹ", "tɹ", "dɹ", "kl", "kɹ", "kw", "ɡl", "ɡɹ", "fl", "fɹ", "θɹ", "ʃɹ",
            "sp", "st", "sk", "sm", "sn", "sl", "sw", "tw", "dw", "θw", "tʃ", "dʒ",
            "pj", "bj", "tj", "dj", "kj", "ɡj", "mj", "nj", "fj", "vj", "hj", "lj");

    private static final List<String> ONSETS_UK = ONSETS_US.stream()
            .map(o -> o.replace('ɹ', 'r').replace('ɡ', 'g')).toList();

    private IpaNormalizer() {
    }

    /**
     * @param espeakWord đầu ra của espeak {@code en-us} cho đúng một token; có thể gồm nhiều phần cách nhau khoảng trắng
     *                   (số, từ ghép)
     * @return một cụm không khoảng trắng
     */
    public static String normalize(String espeakWord) {
        String s = common(espeakWord);
        // Azure không ghi độ dài của ɜ; nguyên âm + r phải đứng liền để ExpectedPhonemes gộp thành một âm như Azure
        s = s.replace("ɜː", "ɜ").replace("ɝː", "ɝ").replace("ɚː", "ɚ")
                .replace("ɑːɹ", "ɑɹ").replace("ɔːɹ", "ɔɹ")
                .replace("oːɹ", "ɔɹ").replace("oː", "ɔ");
        // Bảng phonemes Mỹ không ghi độ dài (iː→i, uː→u, ɑː→ɑ, ɔː→ɔ); ipa_uk mới giữ dấu dài
        s = s.replace("ː", "");
        return placeStress(s, NUCLEUS_US, ONSETS_US);
    }

    /**
     * @param espeakWord đầu ra của espeak {@code en-gb} cho đúng một token
     * @return một cụm không khoảng trắng, hoặc chuỗi rỗng nếu còn ký hiệu ngoài bộ ký hiệu của {@code ipa_uk}
     */
    public static String normalizeUk(String espeakWord) {
        String s = common(espeakWord)
                .replace('ɹ', 'r')
                .replace('ɡ', 'g')
                .replace('ɛ', 'e')
                .replace("ɚ", "ə");
        s = placeStress(s, NUCLEUS_UK, ONSETS_UK);
        return s.chars().allMatch(c -> UK_SYMBOLS.indexOf(c) >= 0) ? s : "";
    }

    /** Phần chung của hai giọng: ghép các phần của token, đổi các ký hiệu espeak dùng mà giáo trình không dùng. */
    private static String common(String espeakWord) {
        String s = espeakWord == null ? "" : espeakWord;
        // Dấu nối của espeak (--ipa=1 dùng "_", --ipa=2 dùng dấu nối ghép) và khoảng trắng giữa các phần của một token
        // Dấu nối ghép (U+035C, U+0361) là dấu kết hợp nên viết bằng mã, tránh dính vào ký tự đứng trước (Sonar java:S5868).
        s = s.replaceAll("[\\s_\\u203F\\u035C\\u0361\\u2016|]+", "");
        s = s.replace("ᵻ", "ɪ")
                .replace("ɾ", "t")
                .replace("ʔ", "t")
                .replace("ɐ", "ə")
                .replace("ɫ", "l");
        // Âm tiết hoá (button = bʌʔn̩): thêm ə trước phụ âm
        return s.replaceAll("([nlm])̩", "ə$1").replace("̩", "");
    }

    /** espeak đặt dấu trọng âm ngay trước nguyên âm; đưa về đầu âm tiết như giáo trình, bỏ ở từ một âm tiết. */
    private static String placeStress(String s, Pattern nucleus, List<String> onsets) {
        if (nucleus.matcher(s).results().count() <= 1) {
            return s.replaceAll("[ˈˌ]", "");
        }
        StringBuilder out = new StringBuilder();
        int from = 0;
        for (int i = 0; i < s.length(); i++) {
            char c = s.charAt(i);
            if (c == 'ˈ' || c == 'ˌ') {
                String before = s.substring(from, i);
                int syllableStart = before.length() - onsetLength(before, out.isEmpty(), onsets);
                out.append(before, 0, syllableStart).append(c).append(before.substring(syllableStart));
                from = i + 1;
            }
        }
        return out.append(s.substring(from)).toString();
    }

    /** Số ký tự cuối của {@code before} thuộc phụ âm đầu âm tiết; đầu từ thì lấy cả cụm phụ âm. */
    private static int onsetLength(String before, boolean wordStart, List<String> onsets) {
        int run = 0;
        while (run < before.length() && VOWEL_CHARS.indexOf(before.charAt(before.length() - 1 - run)) < 0) {
            run++;
        }
        if (wordStart && run == before.length()) {
            return run;
        }
        String consonants = before.substring(before.length() - run);
        for (String onset : onsets) {
            if (consonants.endsWith(onset)) {
                return onset.length();
            }
        }
        return Math.min(run, 1);
    }
}
