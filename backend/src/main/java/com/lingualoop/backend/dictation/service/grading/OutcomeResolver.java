package com.lingualoop.backend.dictation.service.grading;

import org.springframework.stereotype.Component;

import com.lingualoop.backend.dictation.service.WordClass;

/** Phân loại một cặp (từ đúng, từ học viên gõ) theo thứ tự luật ở spec §3.3. */
@Component
public class OutcomeResolver {

    private final EquivalenceTable equivalences;
    private final HomophoneTable homophones;

    public OutcomeResolver(EquivalenceTable equivalences, HomophoneTable homophones) {
        this.equivalences = equivalences;
        this.homophones = homophones;
    }

    /**
     * Không bao giờ trả {@code inserted} hay {@code revealed}: hai kết quả đó do bộ chấm quyết định.
     * Luật "chỉ gõ phần gốc của từ biến đổi" được xét trước luật gần đúng, nếu không nó không bao giờ chạy
     * (iced / ice chỉ cách nhau một chữ cái).
     */
    public WordOutcome resolve(String expected, String actual, WordClass wordClass) {
        if (actual == null || actual.isEmpty()) {
            return WordOutcome.omitted;
        }
        if (equivalences.matches(expected, actual)) {
            return WordOutcome.correct;
        }
        if (homophones.sameGroup(expected, actual)) {
            return WordOutcome.misspelled;
        }
        if (wordClass == WordClass.inflected && expected.startsWith(actual)) {
            return WordOutcome.substituted;
        }
        if (EditDistance.levenshtein(expected, actual) <= EditDistance.nearThreshold(expected)) {
            return WordOutcome.misspelled;
        }
        return WordOutcome.substituted;
    }
}
