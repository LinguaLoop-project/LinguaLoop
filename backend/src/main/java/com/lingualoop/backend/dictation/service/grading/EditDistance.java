package com.lingualoop.backend.dictation.service.grading;

/** Khoảng cách Levenshtein theo ký tự. */
final class EditDistance {

    private EditDistance() {
    }

    static int levenshtein(String a, String b) {
        int[] previous = new int[b.length() + 1];
        int[] current = new int[b.length() + 1];
        for (int j = 0; j <= b.length(); j++) {
            previous[j] = j;
        }
        for (int i = 1; i <= a.length(); i++) {
            current[0] = i;
            for (int j = 1; j <= b.length(); j++) {
                int substitution = previous[j - 1] + (a.charAt(i - 1) == b.charAt(j - 1) ? 0 : 1);
                current[j] = Math.min(substitution, Math.min(previous[j] + 1, current[j - 1] + 1));
            }
            int[] swap = previous;
            previous = current;
            current = swap;
        }
        return previous[b.length()];
    }

    /** Ngưỡng "gần đúng về chữ cái": tối đa max(1, floor(độ dài / 3)) ký tự khác. */
    static int nearThreshold(String expected) {
        return Math.max(1, expected.length() / 3);
    }
}
