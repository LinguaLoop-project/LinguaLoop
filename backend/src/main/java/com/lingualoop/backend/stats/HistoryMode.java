package com.lingualoop.backend.stats;

import java.util.Arrays;
import java.util.List;

import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.lesson.enums.PracticeMode;

/** Bộ lọc chế độ của Lịch sử luyện tập (BR-TH-07). */
enum HistoryMode {
    ALL("all"),
    DICTATION("dictation"),
    SHADOWING("shadowing"),
    VOCAB("vocab"),
    AI("ai");

    private final String code;

    HistoryMode(String code) {
        this.code = code;
    }

    /** Trống là {@code all}; giá trị lạ trả 400. */
    static HistoryMode parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return ALL;
        }
        return Arrays.stream(values()).filter(m -> m.code.equals(raw.strip())).findFirst().orElseThrow(
                () -> new BusinessException(ErrorCode.VALIDATION_FAILED,
                        "mode phải là all, dictation, shadowing, vocab hoặc ai"));
    }

    /** Các chế độ luyện câu mà bộ lọc này gồm; rỗng khi bộ lọc không có Buổi luyện nào. */
    List<PracticeMode> practiceModes() {
        return switch (this) {
            case ALL -> List.of(PracticeMode.dictation, PracticeMode.shadowing);
            case DICTATION -> List.of(PracticeMode.dictation);
            case SHADOWING -> List.of(PracticeMode.shadowing);
            case VOCAB, AI -> List.of();
        };
    }

    boolean includesVocab() {
        return this == ALL || this == VOCAB;
    }

    boolean includesAi() {
        return this == ALL || this == AI;
    }
}
