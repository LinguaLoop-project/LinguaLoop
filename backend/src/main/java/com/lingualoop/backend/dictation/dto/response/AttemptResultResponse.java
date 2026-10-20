package com.lingualoop.backend.dictation.dto.response;

import java.math.BigDecimal;
import java.util.List;

import com.lingualoop.backend.dictation.service.token.WordClass;
import com.lingualoop.backend.dictation.service.grading.WordOutcome;
import com.lingualoop.backend.practice.enums.DictationLevel;

public record AttemptResultResponse(long attemptId, DictationLevel level, BigDecimal score, boolean gaveUp,
        List<GradedWordResponse> words, List<ClassResultResponse> classes, String text, String textVi,
        List<ResultToken> tokens) {

    public AttemptResultResponse {
        words = List.copyOf(words);
        classes = List.copyOf(classes);
        tokens = List.copyOf(tokens);
    }

    /** Một token của câu để hiện cả câu ở mức Easy (từ hiện sẵn giữ nguyên, ô trống tô màu); rỗng ở mức khác. */
    public record ResultToken(int position, String display) {
    }

    /** position, display, expectedWord, wordClass là null ở từ thừa. */
    public record GradedWordResponse(Integer position, String display, String expectedWord, String actualWord,
            WordClass wordClass, WordOutcome outcome, boolean homophone) {
    }

    public record ClassResultResponse(WordClass wordClass, int total, int errors) {
    }
}
