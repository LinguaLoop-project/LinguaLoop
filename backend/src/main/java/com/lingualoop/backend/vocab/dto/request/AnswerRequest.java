package com.lingualoop.backend.vocab.dto.request;

import java.util.UUID;

import com.fasterxml.jackson.annotation.JsonCreator;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * Một câu trả lời của học viên. {@code answerId} do client sinh cho mỗi câu trả lời để gửi lại khi mất mạng không bị ghi
 * hai lần (BR-HT-16). Ở Flashcard học viên tự chọn {@code quality} (1, 3, 4, 5) và {@code correct} bị bỏ qua. Ở Đoán,
 * Trắc nghiệm và Trắc nghiệm đảo server tự quy đổi {@code correct} và {@code hintUsed} sang mức q (BR-HT-12). Hai cờ này
 * có thể vắng mặt (hiểu là false): Flashcard không gửi cờ nào, Trắc nghiệm không gửi {@code hintUsed}.
 */
public record AnswerRequest(
        @NotNull UUID cardId,
        @NotNull UUID answerId,
        @NotNull Mode mode,
        Boolean correct,
        Boolean hintUsed,
        @Min(0) @Max(5) Integer quality,
        @Min(0) Integer responseMs) {

    public boolean isCorrect() {
        return Boolean.TRUE.equals(correct);
    }

    public boolean isHintUsed() {
        return Boolean.TRUE.equals(hintUsed);
    }

    public enum Mode {
        GUESS("guess"),
        FLASHCARD("flashcard"),
        QUIZ("quiz"),
        REVERSE_QUIZ("reverse_quiz");

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
