package com.lingualoop.backend.tutor.entity;

import java.util.Locale;

import com.lingualoop.backend.tutor.SessionOutcome;
import com.lingualoop.backend.tutor.WordStatus;

import jakarta.persistence.AttributeConverter;
import jakarta.persistence.Converter;

/** Cột text của DB viết thường ({@code completed}, {@code needs_practice}), enum Java viết hoa. */
public final class TutorConverters {

    private TutorConverters() {
    }

    @Converter
    public static class Outcome implements AttributeConverter<SessionOutcome, String> {

        @Override
        public String convertToDatabaseColumn(SessionOutcome outcome) {
            return outcome == null ? null : outcome.name().toLowerCase(Locale.ROOT);
        }

        @Override
        public SessionOutcome convertToEntityAttribute(String value) {
            return value == null ? null : SessionOutcome.fromWire(value);
        }
    }

    @Converter
    public static class Status implements AttributeConverter<WordStatus, String> {

        @Override
        public String convertToDatabaseColumn(WordStatus status) {
            return status == null ? null : status.name().toLowerCase(Locale.ROOT);
        }

        @Override
        public WordStatus convertToEntityAttribute(String value) {
            return value == null ? null : WordStatus.valueOf(value.toUpperCase(Locale.ROOT));
        }
    }
}
