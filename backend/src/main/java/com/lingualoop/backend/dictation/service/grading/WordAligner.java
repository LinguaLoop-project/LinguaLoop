package com.lingualoop.backend.dictation.service.grading;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

import org.springframework.stereotype.Component;

/**
 * Căn chỉnh từ đúng với từ học viên gõ bằng quy hoạch động Levenshtein theo từ (giống align()
 * của mockup), thêm bước gộp 2 từ đúng thành 1 từ gõ và tách 1 từ đúng thành 2 từ gõ khi hai bên tương đương.
 */
@Component
public class WordAligner {

    private static final int INDEL = 10;
    private static final int NEAR = 6;
    private static final int FAR = 12;

    private static final byte DIAGONAL = 1;
    private static final byte MERGE_TWO_EXPECTED = 2;
    private static final byte SPLIT_ONE_EXPECTED = 3;
    private static final byte DELETE = 4;
    private static final byte INSERT = 5;

    private final EquivalenceTable table;

    public WordAligner(EquivalenceTable table) {
        this.table = table;
    }

    public List<AlignedPair> align(List<String> expected, List<String> actual) {
        int n = expected.size();
        int m = actual.size();
        int[][] cost = new int[n + 1][m + 1];
        byte[][] choice = new byte[n + 1][m + 1];
        for (int i = 1; i <= n; i++) {
            cost[i][0] = i * INDEL;
            choice[i][0] = DELETE;
        }
        for (int j = 1; j <= m; j++) {
            cost[0][j] = j * INDEL;
            choice[0][j] = INSERT;
        }
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= m; j++) {
                // hòa chi phí thì ưu tiên xóa/chèn: từ khớp là từ đầu tiên, phần lặp về sau là thừa/bỏ sót
                int best = cost[i - 1][j - 1] + substitutionCost(expected.get(i - 1), actual.get(j - 1));
                byte pick = DIAGONAL;
                if (i > 1 && table.matches(expected.get(i - 2) + " " + expected.get(i - 1), actual.get(j - 1))
                        && cost[i - 2][j - 1] < best) {
                    best = cost[i - 2][j - 1];
                    pick = MERGE_TWO_EXPECTED;
                }
                if (j > 1 && table.matches(expected.get(i - 1), actual.get(j - 2) + " " + actual.get(j - 1))
                        && cost[i - 1][j - 2] < best) {
                    best = cost[i - 1][j - 2];
                    pick = SPLIT_ONE_EXPECTED;
                }
                if (cost[i - 1][j] + INDEL <= best) {
                    best = cost[i - 1][j] + INDEL;
                    pick = DELETE;
                }
                if (cost[i][j - 1] + INDEL <= best) {
                    best = cost[i][j - 1] + INDEL;
                    pick = INSERT;
                }
                cost[i][j] = best;
                choice[i][j] = pick;
            }
        }
        return trace(expected, actual, choice);
    }

    private List<AlignedPair> trace(List<String> expected, List<String> actual, byte[][] choice) {
        List<AlignedPair> pairs = new ArrayList<>();
        int i = expected.size();
        int j = actual.size();
        while (i > 0 || j > 0) {
            switch (choice[i][j]) {
                case DIAGONAL -> {
                    String a = actual.get(j - 1);
                    pairs.add(new AlignedPair(i - 1, a, table.matches(expected.get(i - 1), a)));
                    i--;
                    j--;
                }
                case MERGE_TWO_EXPECTED -> {
                    String a = actual.get(j - 1);
                    pairs.add(new AlignedPair(i - 1, a, true));
                    pairs.add(new AlignedPair(i - 2, a, true));
                    i -= 2;
                    j--;
                }
                case SPLIT_ONE_EXPECTED -> {
                    pairs.add(new AlignedPair(i - 1, actual.get(j - 2) + " " + actual.get(j - 1), true));
                    i--;
                    j -= 2;
                }
                case DELETE -> {
                    pairs.add(new AlignedPair(i - 1, null, false));
                    i--;
                }
                default -> {
                    pairs.add(new AlignedPair(null, actual.get(j - 1), false));
                    j--;
                }
            }
        }
        Collections.reverse(pairs);
        return pairs;
    }

    private int substitutionCost(String expected, String actual) {
        if (table.matches(expected, actual)) {
            return 0;
        }
        boolean close = EditDistance.levenshtein(expected, actual) <= EditDistance.nearThreshold(expected)
                || (expected.length() >= 3 && actual.length() >= 3
                        && expected.startsWith(actual.substring(0, 3)));
        return close ? NEAR : FAR;
    }
}
