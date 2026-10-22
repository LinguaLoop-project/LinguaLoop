package com.lingualoop.backend.tutor;

import java.util.Locale;

/**
 * Loại của một lượt người học nói trong Chế độ trò chuyện, do gia sư tự xếp qua tool log_turn.
 */
public enum TopicCategory {
    ON_TOPIC,
    OFF_TOPIC;

    public static TopicCategory fromWire(String value) {
        if (value == null) {
            throw new IllegalArgumentException("topic is required");
        }
        return valueOf(value.trim().toUpperCase(Locale.ROOT));
    }
}
