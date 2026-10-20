package com.lingualoop.backend.dictation.service.grading;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import com.lingualoop.backend.dictation.service.token.WordClass;

class OutcomeResolverTest {

    private final OutcomeResolver resolver = new OutcomeResolver(new EquivalenceTable(), new HomophoneTable());

    @ParameterizedTest(name = "[{index}] {0} <- {1} ({2}) = {3}")
    @CsvSource(value = {
            // luật 1–2: tương đương, bỏ khoảng trắng
            "i'd, i would, function, correct",
            "15, fifteen, number, correct",
            "ok, okay, other, correct",
            "colour, color, content, correct",
            "danang, da nang, proper, correct",
            "alot, a lot, content, correct",
            "hello, hello, content, correct",
            // luật 3: đồng âm
            "their, there, function, misspelled",
            "to, two, function, misspelled",
            "night, knight, content, misspelled",
            // luật 5 trước luật 4: gõ phần gốc của từ biến đổi
            "iced, ice, inflected, substituted",
            "walked, walk, inflected, substituted",
            "ice, iced, content, misspelled",
            // luật 4: gần đúng, áp dụng cả từ chức năng
            "oat, out, content, misspelled",
            "the, they, function, misspelled",
            // luật 6: còn lại
            "fifteen, fifty, number, substituted",
            "with, when, function, substituted",
            // bỏ sót
            "hello, null, content, omitted",
            "hello, '', content, omitted"
    }, nullValues = "null")
    void resolve_appliesRulesInOrder(String expected, String actual, WordClass wordClass, WordOutcome outcome) {
        assertThat(resolver.resolve(expected, actual, wordClass)).isEqualTo(outcome);
    }
}
