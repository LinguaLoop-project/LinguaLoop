package com.lingualoop.backend.vocab.dto.request;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonCreator;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Một câu trả lời của học viên. {@code answerId} do client sinh cho mỗi câu trả lời để gửi lại khi mất mạng không bị ghi
 * hai lần (BR-HT-16). {@code correct} bị bỏ qua ở Flashcard: đúng khi {@code quality} từ 3 trở lên.
 */
public record AnswerRequest(
        @NotNull UUID cardId,
        @NotNull UUID answerId,
        @NotNull Mode mode,
        boolean correct,
        @Min(0) @Max(5) Integer quality,
        @Min(0) Integer responseMs) {

    public enum Mode {
        GUESS("guess"),
        FLASHCARD("flashcard"),
        QUIZ("quiz"),
        REVERSE_QUIZ("reverse_quiz"),
        REPEAT("repeat");

        private final String dbValue;

        Mode(String dbValue) {
            this.dbValue = dbValue;
        }

        public String dbValue() {
            return dbValue;
        }

        /** JSON dùng đúng giá trị lưu trong cơ sở dữ liệu: guess, flashcard, quiz, reverse_quiz, repeat. */
        @JsonCreator
        public static Mode fromJson(String value) {
            for (Mode mode : values()) {
                if (mode.dbValue.equals(value)) {
                    return mode;
                }
            }
            throw new IllegalArgumentException("Unknown mode: " + value);
        }
    }
}
