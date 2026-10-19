package com.lingualoop.backend.dictation.dto.response;

import java.util.List;

import com.lingualoop.backend.practice.enums.DictationLevel;

public record PromptResponse(DictationLevel level, int wordCount, List<PromptToken> tokens) {

    public PromptResponse {
        tokens = List.copyOf(tokens);
    }

    /** Ô trống ({@code blank = true}) không có {@code display}; từ hiện sẵn không có {@code length}. */
    public record PromptToken(int position, String display, Integer length, boolean blank) {
    }
}
