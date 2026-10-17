package com.lingualoop.backend.dictation.service.grading;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;

/** Chuẩn hóa chữ dùng chung cho tách từ và chấm: bộ tách từ duy nhất của dictation. */
public final class Normalizer {

    private Normalizer() {
    }

    /** Một khối không có khoảng trắng thành từ chuẩn hóa (có thể rỗng nếu chỉ có dấu câu). */
    public static String normalize(String chunk) {
        StringBuilder sb = new StringBuilder();
        chunk.toLowerCase(Locale.ROOT).codePoints().forEach(cp -> {
            if (cp == '’' || cp == '‘') {
                sb.append('\'');
            } else if (Character.isLetterOrDigit(cp) || cp == '\'' || cp == '-') {
                sb.appendCodePoint(cp);
            }
        });
        int start = 0;
        int end = sb.length();
        while (start < end && isJoiner(sb.charAt(start))) {
            start++;
        }
        while (end > start && isJoiner(sb.charAt(end - 1))) {
            end--;
        }
        return sb.substring(start, end);
    }

    /** Bỏ ký tự đầu/cuối không phải chữ hoặc số, giữ nguyên hoa/thường. */
    public static String stripEdges(String chunk) {
        int start = 0;
        int end = chunk.length();
        while (start < end && !Character.isLetterOrDigit(chunk.codePointAt(start))) {
            start += Character.charCount(chunk.codePointAt(start));
        }
        while (end > start && !Character.isLetterOrDigit(chunk.codePointBefore(end))) {
            end -= Character.charCount(chunk.codePointBefore(end));
        }
        return chunk.substring(start, end);
    }

    /** Tách theo khoảng trắng, chuẩn hóa từng khối, bỏ khối rỗng; {@code null} coi như rỗng. */
    public static List<String> words(String text) {
        if (text == null) {
            return List.of();
        }
        return Arrays.stream(text.split("\s+"))
                .map(Normalizer::normalize)
                .filter(w -> !w.isEmpty())
                .toList();
    }

    /** Bỏ khoảng trắng và gạch nối để so "Da Nang" với "danang", "well-known" với "well known". */
    public static String squash(String phrase) {
        return phrase.replace(" ", "").replace("-", "");
    }

    private static boolean isJoiner(char c) {
        return c == '\'' || c == '-';
    }
}
