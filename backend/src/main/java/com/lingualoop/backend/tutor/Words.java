package com.lingualoop.backend.tutor;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Chuẩn hóa từ để so khớp giữa câu, kết quả Azure và yêu cầu của người học ("Think," và "think" là một từ).
 */
public final class Words {

    private Words() {
    }

    /** Chữ thường, bỏ dấu câu, giữ dấu nháy đơn (don't). */
    public static String normalize(String word) {
        return word == null ? "" : word.toLowerCase(Locale.ROOT).replaceAll("[^a-z']", "");
    }

    /** Các từ đã chuẩn hóa của câu, theo thứ tự xuất hiện, bỏ token rỗng. */
    public static List<String> tokens(String sentence) {
        List<String> result = new ArrayList<>();
        if (sentence == null) {
            return result;
        }
        for (String raw : sentence.trim().split("\\s+")) {
            String key = normalize(raw);
            if (!key.isEmpty()) {
                result.add(key);
            }
        }
        return result;
    }

    /** Từ viết như trong câu (bỏ dấu câu ở hai đầu), hoặc null nếu câu không có từ đó. */
    public static String displayFor(String sentence, String key) {
        if (sentence == null) {
            return null;
        }
        for (String raw : sentence.trim().split("\\s+")) {
            if (normalize(raw).equals(key)) {
                return trimToLetters(raw);
            }
        }
        return null;
    }

    /** Bỏ ký tự không phải chữ cái hay dấu nháy đơn ở hai đầu; viết bằng vòng lặp để không phụ thuộc regex. */
    private static String trimToLetters(String raw) {
        int start = 0;
        int end = raw.length();
        while (start < end && !isLetterOrApostrophe(raw.charAt(start))) {
            start++;
        }
        while (end > start && !isLetterOrApostrophe(raw.charAt(end - 1))) {
            end--;
        }
        return raw.substring(start, end);
    }

    private static boolean isLetterOrApostrophe(char c) {
        return c == '\'' || (c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z');
    }
}
