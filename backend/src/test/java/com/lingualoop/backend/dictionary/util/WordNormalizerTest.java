package com.lingualoop.backend.dictionary.util;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class WordNormalizerTest {

    @ParameterizedTest
    @CsvSource(delimiter = '|', value = {
        "Hello|hello",
        "  HELLO  |hello",
        "don't.|don't",
        "\"Don't\"|don't",
        "don’t|don't",
        "(well-known)|well-known",
        "Look   UP|look up",
        "...hello!?|hello",
        "123|123",
    })
    void normalize_returnsLowercaseTrimmedHeadword(String raw, String expected) {
        assertThat(WordNormalizer.normalize(raw)).contains(expected);
    }

    @ParameterizedTest
    @NullAndEmptySource
    @ValueSource(strings = { "   ", "...", "'", "?!" })
    void normalize_returnsEmptyWhenNoLetterOrDigit(String raw) {
        assertThat(WordNormalizer.normalize(raw)).isEmpty();
    }

    @Test
    void normalize_returnsEmptyWhenTooLong() {
        assertThat(WordNormalizer.normalize("a".repeat(WordNormalizer.MAX_LENGTH))).isPresent();
        assertThat(WordNormalizer.normalize("a".repeat(WordNormalizer.MAX_LENGTH + 1))).isEmpty();
    }

    @Test
    void escapeLike_escapesWildcardsAndBackslash() {
        assertThat(WordNormalizer.escapeLike("100%_a\\b")).isEqualTo("100\\%\\_a\\\\b");
    }
}
