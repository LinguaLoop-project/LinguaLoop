package com.lingualoop.backend.tutor;

import java.util.Locale;

/** Đích của một Lượt chấm: một từ hay cả câu. */
public enum AttemptTarget {
    WORD,
    SENTENCE;

    public static AttemptTarget fromWire(String value) {
        if (value == null) {
            throw new IllegalArgumentException("target is required");
        }
        return valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}
