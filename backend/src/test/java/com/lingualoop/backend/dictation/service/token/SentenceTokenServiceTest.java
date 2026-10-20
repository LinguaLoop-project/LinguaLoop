package com.lingualoop.backend.dictation.service.token;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.stream.Stream;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class SentenceTokenServiceTest {

    private static final String LATTE = "I'd like a large iced latte with oat milk, please.";

    private final SentenceTokenService service = GradingTestSupport.tokenService();

    @Test
    void tokenize_keepsPositionsDisplayAndNormalized() {
        List<SentenceToken> tokens = service.tokenize(LATTE);

        assertThat(tokens).hasSize(10);
        assertThat(tokens).extracting(SentenceToken::position).containsExactly(0, 1, 2, 3, 4, 5, 6, 7, 8, 9);
        assertThat(tokens.get(8).display()).isEqualTo("milk,");
        assertThat(tokens.get(8).normalized()).isEqualTo("milk");
        assertThat(tokens.get(9).display()).isEqualTo("please.");
        assertThat(tokens.get(9).normalized()).isEqualTo("please");
        assertThat(tokens.get(0).normalized()).isEqualTo("i'd");
    }

    static Stream<Arguments> classCases() {
        return Stream.of(
                Arguments.of(LATTE, 0, WordClass.function),
                Arguments.of(LATTE, 1, WordClass.content),
                Arguments.of(LATTE, 2, WordClass.function),
                Arguments.of(LATTE, 3, WordClass.content),
                Arguments.of(LATTE, 4, WordClass.inflected),
                Arguments.of(LATTE, 5, WordClass.content),
                Arguments.of(LATTE, 6, WordClass.function),
                Arguments.of(LATTE, 7, WordClass.content),
                Arguments.of(LATTE, 8, WordClass.content),
                Arguments.of(LATTE, 9, WordClass.content),
                Arguments.of("The class is great.", 1, WordClass.content),
                Arguments.of("She always smiles.", 1, WordClass.content),
                Arguments.of("She always smiles.", 2, WordClass.inflected),
                Arguments.of("What is the news?", 3, WordClass.content),
                Arguments.of("I like this.", 2, WordClass.function),
                Arguments.of("We visited Da Nang last summer.", 1, WordClass.inflected),
                Arguments.of("We visited Da Nang last summer.", 2, WordClass.proper),
                Arguments.of("We visited Da Nang last summer.", 3, WordClass.proper),
                Arguments.of("Anna lives here.", 0, WordClass.content),
                Arguments.of("Anna lives here.", 1, WordClass.inflected),
                Arguments.of("Hello. Anna lives here.", 1, WordClass.content),
                Arguments.of("I paid fifteen dollars, 20 cents.", 2, WordClass.number),
                Arguments.of("I paid fifteen dollars, 20 cents.", 3, WordClass.inflected),
                Arguments.of("I paid fifteen dollars, 20 cents.", 4, WordClass.number),
                Arguments.of("It costs twenty-five dollars.", 2, WordClass.number),
                Arguments.of("Oh, wow!", 0, WordClass.other),
                Arguments.of("Oh, wow!", 1, WordClass.other),
                Arguments.of("We sing in the morning.", 1, WordClass.content),
                Arguments.of("We sing in the morning.", 4, WordClass.content),
                Arguments.of("The Beatles sang.", 0, WordClass.function),
                Arguments.of("The Beatles sang.", 1, WordClass.proper),
                Arguments.of("We saw The Beatles.", 2, WordClass.function),
                Arguments.of("We saw The Beatles.", 3, WordClass.proper),
                Arguments.of("They need speed.", 1, WordClass.content),
                Arguments.of("They need speed.", 2, WordClass.content));
    }

    @ParameterizedTest(name = "[{index}] \"{0}\" token {1} -> {2}")
    @MethodSource("classCases")
    void tokenize_classifiesWords(String sentence, int index, WordClass expected) {
        assertThat(service.tokenize(sentence).get(index).wordClass()).isEqualTo(expected);
    }

    @Test
    void tokenize_punctuationOnlyChunkKeepsPositionButIsOther() {
        List<SentenceToken> tokens = service.tokenize("Wait - what");

        assertThat(tokens).hasSize(3);
        assertThat(tokens.get(1).position()).isEqualTo(1);
        assertThat(tokens.get(1).normalized()).isEmpty();
        assertThat(tokens.get(1).wordClass()).isEqualTo(WordClass.other);
        assertThat(tokens.get(2).position()).isEqualTo(2);
        assertThat(tokens.get(2).normalized()).isEqualTo("what");
    }

    @Test
    void tokenize_hyphenatedWordIsOneToken() {
        List<SentenceToken> tokens = service.tokenize("a well-known actor");

        assertThat(tokens).hasSize(3);
        assertThat(tokens.get(1).display()).isEqualTo("well-known");
        assertThat(tokens.get(1).normalized()).isEqualTo("well-known");
    }

    @Test
    void tokenize_emptyAndNull() {
        assertThat(service.tokenize(null)).isEmpty();
        assertThat(service.tokenize("")).isEmpty();
        assertThat(service.tokenize("   ")).isEmpty();
        assertThat(service.tokenize("...")).hasSize(1);
        assertThat(service.tokenize("...").get(0).wordClass()).isEqualTo(WordClass.other);
    }
}
