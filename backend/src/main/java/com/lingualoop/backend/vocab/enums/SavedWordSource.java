package com.lingualoop.backend.vocab.enums;

import java.util.Arrays;

import com.fasterxml.jackson.annotation.JsonValue;

/** Nơi từ được lưu: hộp tra từ điển, hoặc một câu trong bài học (thẻ có {@code source_sentence_id}). */
public enum SavedWordSource {
    DICTIONARY("dictionary"),
    LESSON("lesson");

    private final String dbValue;

    SavedWordSource(String dbValue) {
        this.dbValue = dbValue;
    }

    @JsonValue
    public String dbValue() {
        return dbValue;
    }

    public static SavedWordSource fromDb(String value) {
        return Arrays.stream(values()).filter(s -> s.dbValue.equals(value)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown saved word source: " + value));
    }
}
