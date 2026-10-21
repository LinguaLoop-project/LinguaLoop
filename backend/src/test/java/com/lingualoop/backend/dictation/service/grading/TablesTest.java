package com.lingualoop.backend.dictation.service.grading;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import com.lingualoop.backend.dictation.util.WordListLoader;

class TablesTest {

    private final EquivalenceTable equivalences = new EquivalenceTable();
    private final HomophoneTable homophones = new HomophoneTable();

    @ParameterizedTest
    @CsvSource({
            "i'd, i would", "i would, i'd", "15, fifteen", "ok, okay", "colour, color",
            "danang, da nang", "alot, a lot", "well-known, well known", "hello, hello"})
    void equivalence_matchesEquivalentForms(String a, String b) {
        assertThat(equivalences.matches(a, b)).isTrue();
    }

    @ParameterizedTest
    @CsvSource({"fifteen, fifty", "i'd, i will", "cat, dog"})
    void equivalence_rejectsDifferentWords(String a, String b) {
        assertThat(equivalences.matches(a, b)).isFalse();
    }

    @ParameterizedTest
    @CsvSource({"their, there", "there, they're", "to, two", "night, knight"})
    void homophones_sameGroup(String a, String b) {
        assertThat(homophones.sameGroup(a, b)).isTrue();
    }

    @ParameterizedTest
    @CsvSource({"their, their", "cat, dog"})
    void homophones_notSameGroup(String a, String b) {
        assertThat(homophones.sameGroup(a, b)).isFalse();
    }

    @Test
    void tables_parseCommentsBlankLinesAndSymmetry() {
        EquivalenceTable table = new EquivalenceTable(List.of("# chú thích", "", "a = b"));
        assertThat(table.matches("a", "b")).isTrue();
        assertThat(table.matches("b", "a")).isTrue();
        assertThat(new HomophoneTable(List.of("x y z")).sameGroup("x", "z")).isTrue();
    }

    @Test
    void equivalenceFile_everyLineHasExactlyTwoSides() {
        for (String line : WordListLoader.load("dictation/equivalents.txt")) {
            assertThat(line.split("=")).as(line).hasSize(2);
        }
    }

    @Test
    void homophoneFile_everyGroupHasAtLeastTwoWords() {
        List<String> groups = WordListLoader.load("dictation/homophones.txt");
        assertThat(groups).hasSizeGreaterThanOrEqualTo(50);
        for (String line : groups) {
            assertThat(line.split("\s+")).as(line).hasSizeGreaterThanOrEqualTo(2);
        }
    }
}
