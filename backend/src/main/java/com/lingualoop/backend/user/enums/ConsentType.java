package com.lingualoop.backend.user.enums;

import java.util.Locale;
import java.util.Optional;

import com.fasterxml.jackson.annotation.JsonValue;


public enum ConsentType {
    VOICE_STORAGE,
    AI_PROCESSING;

    /** Giá trị lưu trong DB, trong URL và trong JSON. */
    @JsonValue
    public String value() {
        return name().toLowerCase(Locale.ROOT);
    }

    public static Optional<ConsentType> fromValue(String value) {
        if (value == null) {
            return Optional.empty();
        }
        for (ConsentType type : values()) {
            if (type.value().equalsIgnoreCase(value)) {
                return Optional.of(type);
            }
        }
        return Optional.empty();
    }
}
