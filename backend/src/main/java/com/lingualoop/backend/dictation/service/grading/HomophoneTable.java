package com.lingualoop.backend.dictation.service.grading;

import java.util.Arrays;
import java.util.Collection;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.Set;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.dictation.util.WordListLoader;

/** Nhóm từ đồng âm (their / there / they're). Từ đồng âm gõ nhầm được tính là misspelled. */
@Component
public class HomophoneTable {

    private final Map<String, Set<String>> groupsByWord = new HashMap<>();

    public HomophoneTable() {
        this(WordListLoader.load("dictation/homophones.txt"));
    }

    HomophoneTable(Collection<String> lines) {
        for (String raw : lines) {
            String line = raw.trim();
            if (line.isEmpty() || line.startsWith("#")) {
                continue;
            }
            Set<String> group = new HashSet<>(Arrays.asList(line.split("\s+")));
            for (String word : group) {
                groupsByWord.computeIfAbsent(word, k -> new HashSet<>()).addAll(group);
            }
        }
    }

    public boolean sameGroup(String a, String b) {
        return !a.equals(b) && groupsByWord.getOrDefault(a, Set.of()).contains(b);
    }
}
