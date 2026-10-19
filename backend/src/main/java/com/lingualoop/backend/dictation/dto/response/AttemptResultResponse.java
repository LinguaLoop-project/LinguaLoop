package com.lingualoop.backend.dictation.dto.response;

import java.math.BigDecimal;
import java.util.List;

import com.lingualoop.backend.dictation.service.WordClass;
import com.lingualoop.backend.dictation.service.grading.WordOutcome;
import com.lingualoop.backend.practice.enums.DictationLevel;

public record AttemptResultResponse(long attemptId, DictationLevel level, BigDecimal score, boolean gaveUp,
        List<GradedWordResponse> words, List<ClassResultResponse> classes, String text, String textVi) {

    public AttemptResultResponse {
        words = List.copyOf(words);
        classes = List.copyOf(classes);
    }

    /** {@code position}, {@code display}, {@code expectedWord}, {@code wordClass} là null ở từ thừa. */
    public record GradedWordResponse(Integer position, String display, String expectedWord, String actualWord,
            WordClass wordClass, WordOutcome outcome, boolean homophone) {
    }

    public record ClassResultResponse(WordClass wordClass, int total, int errors) {
    }
}
