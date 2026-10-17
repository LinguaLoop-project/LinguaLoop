package com.lingualoop.backend.dictation.service.grading;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.junit.jupiter.api.Assertions.assertTimeoutPreemptively;

import java.math.BigDecimal;
import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.dictation.service.GradingTestSupport;
import com.lingualoop.backend.dictation.service.WordClass;

class DictationGraderTest {

    private final EquivalenceTable equivalences = new EquivalenceTable();
    private final HomophoneTable homophones = new HomophoneTable();
    private final DictationGrader grader = new DictationGrader(GradingTestSupport.tokenService(),
            new WordAligner(equivalences), new OutcomeResolver(equivalences, homophones), homophones);

    private static BigDecimal score(String value) {
        return new BigDecimal(value);
    }

    private static WordOutcome[] outcomes(GradedAttempt attempt) {
        return attempt.words().stream().map(GradedWord::outcome).toArray(WordOutcome[]::new);
    }

    // ── bảng test §12 của README_Dictation_Plan.md (Normal/Hard) ───────────

    @Test
    void gradeFull_ignoresCaseAndExtraWhitespace() {
        GradedAttempt a = grader.gradeFull("Hello World", "hello world", Set.of());
        GradedAttempt b = grader.gradeFull("hello world", "hello  world", Set.of());

        assertThat(outcomes(a)).containsExactly(WordOutcome.correct, WordOutcome.correct);
        assertThat(a.score()).isEqualTo(score("100.00"));
        assertThat(outcomes(b)).containsExactly(WordOutcome.correct, WordOutcome.correct);
    }

    @Test
    void gradeFull_reportsMissingWords() {
        GradedAttempt result = grader.gradeFull("meet me at the station", "meet at station", Set.of());

        assertThat(outcomes(result)).containsExactly(WordOutcome.correct, WordOutcome.omitted,
                WordOutcome.correct, WordOutcome.omitted, WordOutcome.correct);
        assertThat(result.words().get(1).actualWord()).isNull();
        assertThat(result.words().get(1).expectedWord()).isEqualTo("me");
        assertThat(result.score()).isEqualTo(score("60.00"));
    }

    @Test
    void gradeFull_reportsExtraWordWithoutPositionAndLowersScore() {
        GradedAttempt result = grader.gradeFull("meet me at the station", "meet me at the old station", Set.of());

        GradedWord extra = result.words().get(4);
        assertThat(extra.outcome()).isEqualTo(WordOutcome.inserted);
        assertThat(extra.position()).isNull();
        assertThat(extra.expectedWord()).isNull();
        assertThat(extra.wordClass()).isNull();
        assertThat(extra.actualWord()).isEqualTo("old");
        assertThat(result.score()).isEqualTo(score("83.33"));
    }

    @Test
    void gradeFull_wrongNumberWordIsSubstituted() {
        assertThat(outcomes(grader.gradeFull("fifty", "fifteen", Set.of()))).containsExactly(WordOutcome.substituted);
        GradedAttempt result = grader.gradeFull("fifteen", "fifty", Set.of());
        assertThat(outcomes(result)).containsExactly(WordOutcome.substituted);
        assertThat(result.words().get(0).wordClass()).isEqualTo(WordClass.number);
        assertThat(result.score()).isEqualTo(score("0.00"));
    }

    @Test
    void gradeFull_punctuationIsIgnored() {
        assertThat(outcomes(grader.gradeFull("Hello.", "Hello", Set.of()))).containsExactly(WordOutcome.correct);
        assertThat(grader.gradeFull("Hello", "Hello!!!", Set.of()).score()).isEqualTo(score("100.00"));
    }

    @Test
    void gradeFull_emptyAnswerIsNotAnError() {
        for (String typed : new String[] {"", null, "...", "   "}) {
            GradedAttempt result = grader.gradeFull("Hello", typed, Set.of());
            assertThat(outcomes(result)).as("typed=%s", typed).containsExactly(WordOutcome.omitted);
            assertThat(result.score()).isEqualTo(score("0.00"));
        }
    }

    // ── các trường hợp ở mục 3.3 ────────────────────────────────────────────

    @Test
    void gradeFull_equivalentFormsAreCorrect() {
        assertThat(outcomes(grader.gradeFull("I'd like it.", "I would like it", Set.of())))
                .containsExactly(WordOutcome.correct, WordOutcome.correct, WordOutcome.correct);
        assertThat(grader.gradeFull("I paid 15 dollars.", "I paid fifteen dollars", Set.of()).score())
                .isEqualTo(score("100.00"));
        assertThat(outcomes(grader.gradeFull("We went to Da Nang.", "we went to danang", Set.of())))
                .containsOnly(WordOutcome.correct).hasSize(5);
        assertThat(outcomes(grader.gradeFull("That is a lot.", "that is alot", Set.of())))
                .containsOnly(WordOutcome.correct).hasSize(4);
    }

    @Test
    void gradeFull_homophoneIsMisspelledAndFlagged() {
        GradedAttempt result = grader.gradeFull("over there", "over their", Set.of());

        assertThat(result.words().get(1).outcome()).isEqualTo(WordOutcome.misspelled);
        assertThat(result.words().get(1).homophone()).isTrue();
        assertThat(result.words().get(0).homophone()).isFalse();
    }

    @Test
    void gradeFull_typingOnlyTheStemOfAnInflectedWordIsSubstituted() {
        GradedAttempt result = grader.gradeFull("iced tea", "ice tea", Set.of());

        assertThat(outcomes(result)).containsExactly(WordOutcome.substituted, WordOutcome.correct);
        assertThat(result.words().get(0).wordClass()).isEqualTo(WordClass.inflected);
    }

    @Test
    void gradeFull_closeSpellingIsMisspelledButNotHomophone() {
        GradedAttempt result = grader.gradeFull("oat milk", "out milk", Set.of());

        assertThat(result.words().get(0).outcome()).isEqualTo(WordOutcome.misspelled);
        assertThat(result.words().get(0).homophone()).isFalse();
    }

    // ── điểm, revealed, từ thừa ─────────────────────────────────────────────

    @Test
    void gradeFull_revealedWordCountsAsWrong() {
        GradedAttempt result = grader.gradeFull("a b c", "a b c", Set.of(1));

        assertThat(outcomes(result)).containsExactly(WordOutcome.correct, WordOutcome.revealed, WordOutcome.correct);
        assertThat(result.words().get(1).actualWord()).isEqualTo("b");
        assertThat(result.score()).isEqualTo(score("66.67"));
    }

    @Test
    void gradeFull_revealedPositionOutOfRangeIsIgnored() {
        assertThat(grader.gradeFull("a b", "a b", Set.of(99)).score()).isEqualTo(score("100.00"));
        assertThat(grader.gradeFull("a b", "a b", null).score()).isEqualTo(score("100.00"));
    }

    @Test
    void gradeFull_insertedWordsEnterTheDenominator() {
        GradedAttempt result = grader.gradeFull("a", "a x y", Set.of());

        assertThat(outcomes(result)).containsExactly(WordOutcome.correct, WordOutcome.inserted, WordOutcome.inserted);
        assertThat(result.score()).isEqualTo(score("33.33"));
    }

    @Test
    void gradeFull_repeatedWordMatchesTheFirstAndInsertsTheRest() {
        GradedAttempt result = grader.gradeFull("the", "the the the", Set.of());

        assertThat(outcomes(result)).containsExactly(WordOutcome.correct, WordOutcome.inserted, WordOutcome.inserted);
    }

    // ── dấu câu, câu rỗng, null ─────────────────────────────────────────────

    @Test
    void gradeFull_punctuationOnlyTokenIsNotGradedAndKeepsPositions() {
        GradedAttempt result = grader.gradeFull("Wait - what", "wait what", Set.of());

        assertThat(result.words()).extracting(GradedWord::position).containsExactly(0, 2);
        assertThat(outcomes(result)).containsOnly(WordOutcome.correct);
        assertThat(result.score()).isEqualTo(score("100.00"));
    }

    @Test
    void gradeFull_sentenceWithoutWordsScoresZero() {
        GradedAttempt typedSomething = grader.gradeFull("...", "hello", Set.of());
        assertThat(outcomes(typedSomething)).containsExactly(WordOutcome.inserted);
        assertThat(typedSomething.score()).isEqualTo(score("0.00"));

        for (String sentence : new String[] {"", "   ", null}) {
            GradedAttempt empty = grader.gradeFull(sentence, "", Set.of());
            assertThat(empty.words()).isEmpty();
            assertThat(empty.score()).isEqualTo(score("0.00"));
        }
    }

    @Test
    void gradeFull_curlyApostropheAccentsAndEmojiDoNotBreakMatching() {
        assertThat(grader.gradeFull("Don't stop", "Don’t stop", Set.of()).score()).isEqualTo(score("100.00"));
        assertThat(grader.gradeFull("a café", "a café", Set.of()).score()).isEqualTo(score("100.00"));
        GradedAttempt emoji = grader.gradeFull("hello", "hello 😀", Set.of());
        assertThat(outcomes(emoji)).containsExactly(WordOutcome.correct);
    }

    @Test
    void gradeFull_veryLongAnswerFinishesQuickly() {
        String typed = IntStream.range(0, 2000).mapToObj(i -> "zz" + i).collect(Collectors.joining(" "));

        GradedAttempt result = assertTimeoutPreemptively(Duration.ofSeconds(2),
                () -> grader.gradeFull("one two three four five six seven eight nine ten", typed, Set.of()));

        long inserted = result.words().stream().filter(w -> w.outcome() == WordOutcome.inserted).count();
        assertThat(inserted).isGreaterThanOrEqualTo(1990);
    }

    // ── Easy: chấm các ô trống ──────────────────────────────────────────────

    @Test
    void gradeBlanks_gradesOnlyBlankPositionsInOrder() {
        GradedAttempt result = grader.gradeBlanks("I'd like a large iced latte", Map.of(4, "ice", 1, "like"), Set.of());

        assertThat(result.words()).extracting(GradedWord::position).containsExactly(1, 4);
        assertThat(outcomes(result)).containsExactly(WordOutcome.correct, WordOutcome.substituted);
        assertThat(result.words().get(1).display()).isEqualTo("iced");
        assertThat(result.score()).isEqualTo(score("50.00"));
    }

    @Test
    void gradeBlanks_emptyValueIsOmittedAndRevealedOverrides() {
        assertThat(outcomes(grader.gradeBlanks("I'd like a large", Map.of(1, ""), Set.of())))
                .containsExactly(WordOutcome.omitted);

        GradedAttempt revealed = grader.gradeBlanks("I'd like a large", Map.of(1, ""), Set.of(1));
        assertThat(outcomes(revealed)).containsExactly(WordOutcome.revealed);
        assertThat(revealed.score()).isEqualTo(score("0.00"));
    }

    @Test
    void gradeBlanks_acceptsEquivalentPhraseInOneBlank() {
        GradedAttempt result = grader.gradeBlanks("I'd like a large", Map.of(0, "i would"), Set.of());

        assertThat(outcomes(result)).containsExactly(WordOutcome.correct);
    }

    @Test
    void gradeBlanks_rejectsPositionsThatAreNotGradableWords() {
        assertThatThrownBy(() -> grader.gradeBlanks("I'd like a large", Map.of(99, "x"), Set.of()))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> grader.gradeBlanks("Wait - what", Map.of(1, "x"), Set.of()))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> grader.gradeBlanks("Wait what", Map.of(-1, "x"), Set.of()))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void gradeBlanks_noBlanksScoresZeroWithoutWords() {
        GradedAttempt result = grader.gradeBlanks("I'd like a large", Map.of(), Set.of());

        assertThat(result.words()).isEmpty();
        assertThat(result.score()).isEqualTo(score("0.00"));
    }
}
