package com.lingualoop.backend.dictation.service.grading;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

import com.lingualoop.backend.dictation.util.WordListLoader;

class NormalizerTest {

    static Stream<Arguments> normalizeCases() {
        return Stream.of(
                Arguments.of("Hello,", "hello"),
                Arguments.of("\"Hello\"", "hello"),
                Arguments.of("Don’t", "don't"),
                Arguments.of("don't", "don't"),
                Arguments.of("'quoted'", "quoted"),
                Arguments.of("well-known", "well-known"),
                Arguments.of("-well-", "well"),
                Arguments.of("U.S.A.", "usa"),
                Arguments.of("1,000", "1000"),
                Arguments.of("3.5", "35"),
                Arguments.of("café", "café"),
                Arguments.of("ICE!", "ice"),
                Arguments.of("...", ""),
                Arguments.of("—", ""),
                Arguments.of("😀", ""));
    }

    @ParameterizedTest
    @MethodSource("normalizeCases")
    void normalize_lowercasesAndKeepsOnlyLettersDigitsApostropheAndInnerHyphen(String chunk, String expected) {
        assertThat(Normalizer.normalize(chunk)).isEqualTo(expected);
    }

    @Test
    void stripEdges_removesEdgePunctuationButKeepsCase() {
        assertThat(Normalizer.stripEdges("(Hanoi),")).isEqualTo("Hanoi");
        assertThat(Normalizer.stripEdges("\"Hello\"")).isEqualTo("Hello");
    }

    @Test
    void words_splitsOnWhitespaceNormalizesAndDropsEmptyChunks() {
        assertThat(Normalizer.words("  Hello   World. ")).containsExactly("hello", "world");
        assertThat(Normalizer.words("hello  world")).containsExactly("hello", "world");
        assertThat(Normalizer.words("...")).isEqualTo(List.of());
        assertThat(Normalizer.words("")).isEmpty();
        assertThat(Normalizer.words(null)).isEmpty();
    }

    @Test
    void squash_removesSpacesAndHyphens() {
        assertThat(Normalizer.squash("da nang")).isEqualTo("danang");
        assertThat(Normalizer.squash("well-known")).isEqualTo("wellknown");
    }

    @Test
    void wordListLoader_throwsWhenResourceIsMissing() {
        assertThatThrownBy(() -> WordListLoader.load("dictation/__missing__.txt"))
                .isInstanceOf(IllegalStateException.class);
    }
}
