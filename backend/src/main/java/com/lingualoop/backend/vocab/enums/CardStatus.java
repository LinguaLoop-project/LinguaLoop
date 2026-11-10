package com.lingualoop.backend.vocab.enums;

import java.util.Arrays;

import com.fasterxml.jackson.annotation.JsonValue;

/**
 * Trạng thái thẻ của một học viên (BR-HT-08). Giá trị lưu ở {@code user_card_progress.status}; thẻ chưa có dòng
 * tiến độ là {@link #NEW}.
 */
public enum CardStatus {
    NEW("new"),
    LEARNING("learning"),
    REVIEWING("reviewing"),
    MASTERED("mastered");

    private final String dbValue;

    CardStatus(String dbValue) {
        this.dbValue = dbValue;
    }

    @JsonValue
    public String dbValue() {
        return dbValue;
    }

    public static CardStatus fromDb(String value) {
        return Arrays.stream(values()).filter(s -> s.dbValue.equals(value)).findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Unknown card status: " + value));
    }
}
