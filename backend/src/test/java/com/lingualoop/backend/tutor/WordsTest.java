package com.lingualoop.backend.tutor;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class WordsTest {

    @Test
    void normalize_lowercasesAndKeepsOnlyLettersAndApostrophes() {
        assertThat(Words.normalize("Don't,")).isEqualTo("don't");
        assertThat(Words.normalize("...")).isEmpty();
        assertThat(Words.normalize(null)).isEmpty();
    }

    @Test
    void displayFor_returnsTheWordAsWrittenWithoutOuterPunctuation() {
        String sentence = "If \"things\" don't work out, - you'll see!";

        assertThat(Words.displayFor(sentence, "things")).isEqualTo("things");
        assertThat(Words.displayFor(sentence, "don't")).isEqualTo("don't");
        assertThat(Words.displayFor(sentence, "out")).isEqualTo("out");
        assertThat(Words.displayFor(sentence, "see")).isEqualTo("see");
        assertThat(Words.displayFor(sentence, "missing")).isNull();
        assertThat(Words.displayFor(null, "a")).isNull();
    }

    @Test
    void displayFor_keepsInnerPunctuationAndTrimsAnyLengthOfPunctuation() {
        assertThat(Words.displayFor("well-known!!!", "wellknown")).isEqualTo("well-known");
        assertThat(Words.displayFor("(((hello)))", "hello")).isEqualTo("hello");
    }
}
