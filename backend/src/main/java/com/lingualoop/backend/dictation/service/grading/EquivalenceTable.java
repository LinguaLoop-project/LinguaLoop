package com.lingualoop.backend.dictation.service.grading;

import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.dictation.util.WordListLoader;

/**
 * Bảng tương đương: các cặp được coi là đúng thay nhau (I'd / I would, 15 / fifteen,
 * colour / color) và các cụm chỉ khác khoảng trắng hoặc gạch nối (Da Nang / danang).
 */
@Component
public final class EquivalenceTable {

    private final Map<String, Set<String>> pairs = new HashMap<>();

    public EquivalenceTable() {
        this(WordListLoader.load("dictation/equivalents.txt"));
    }

    EquivalenceTable(Collection<String> lines) {
        for (String raw : lines) {
            String line = raw.trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            String[] sides = line.split("=");
            if (sides.length != 2) {
                throw new IllegalStateException("Invalid equivalence line: " + raw);
            }
            String left = sides[0].trim();
            String right = sides[1].trim();
            pairs.computeIfAbsent(left, k -> new HashSet<>()).add(right);
            pairs.computeIfAbsent(right, k -> new HashSet<>()).add(left);
        }
    }

    /** a, b là từ hoặc cụm đã chuẩn hóa. Đối xứng, không bắc cầu. */
    public boolean matches(String a, String b) {
        return a.equals(b)
                || Normalizer.squash(a).equals(Normalizer.squash(b))
                || pairs.getOrDefault(a, Set.of()).contains(b);
    }
}
