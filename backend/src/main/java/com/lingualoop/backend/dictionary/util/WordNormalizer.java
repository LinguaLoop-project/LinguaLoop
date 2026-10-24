package com.lingualoop.backend.dictionary.util;

import java.util.Locale;
import java.util.Optional;

/** Chuẩn hoá chữ người dùng gửi lên về dạng headword. */
public final class WordNormalizer {

    public static final int MAX_LENGTH = 64;

    private WordNormalizer() {
    }

    /**
     * Bỏ dấu câu ở hai đầu ("don't." -> "don't"), đổi dấu nháy cong thành ', gộp khoảng trắng.
     */
    public static Optional<String> normalize(String raw) {
        if (raw == null) {
            return Optional.empty();
        }
        String s = raw.replace('’', '\'').replace('‘', '\'').replace('`', '\'').replace('´', '\'')
                .strip().toLowerCase(Locale.ROOT).replaceAll("\\s+", " ");
        int start = 0;
        int end = s.length();
        while (start < end && !Character.isLetterOrDigit(s.charAt(start))) {
            start++;
        }
        while (end > start && !Character.isLetterOrDigit(s.charAt(end - 1))) {
            end--;
        }
        s = s.substring(start, end);
        return s.isEmpty() || s.length() > MAX_LENGTH ? Optional.empty() : Optional.of(s);
    }

    /** Escape ký tự đặc biệt của LIKE (dấu gạch chéo ngược là escape mặc định của Postgres). */
    public static String escapeLike(String s) {
        return s.replace("\\", "\\\\")
                .replace("%", "\\%")
                .replace("_", "\\_");
    }
}
