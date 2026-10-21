package com.lingualoop.backend.dictation.dto.response;

import java.util.List;

import com.lingualoop.backend.practice.enums.DictationLevel;

public record PromptResponse(DictationLevel level, int wordCount, List<PromptToken> tokens) {

    public PromptResponse {
        tokens = List.copyOf(tokens);
    }

    /** Ô trống (blank = true) không có display; từ hiện sẵn không có length. */
    public record PromptToken(int position, String display, Integer length, boolean blank) {
    }
}
