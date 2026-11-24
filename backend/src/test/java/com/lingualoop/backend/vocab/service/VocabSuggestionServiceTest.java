package com.lingualoop.backend.vocab.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.vocab.repository.VocabSuggestionRepository.PartCandidate;

/** Chọn phần từ mới gợi ý khi học viên không còn gì để ôn, và bộ khởi đầu theo cấp độ (BR-HT-32). */
class VocabSuggestionServiceTest {

    private static final UUID DECK_A = UUID.fromString("00000000-0000-0000-0000-00000000000a");
    private static final UUID DECK_B = UUID.fromString("00000000-0000-0000-0000-00000000000b");
    private static final UUID DECK_C = UUID.fromString("00000000-0000-0000-0000-00000000000c");
    private static final UUID DECK_D = UUID.fromString("00000000-0000-0000-0000-00000000000d");
    private static final Instant NOW = Instant.parse("2026-11-17T08:00:00Z");

    private static PartCandidate part(UUID deck, boolean system, int number, int newCards, Instant lastStudied) {
        return leveled(deck, system, null, number, newCards, lastStudied);
    }

    private static PartCandidate leveled(UUID deck, boolean system, String level, int number, int newCards,
            Instant lastStudied) {
        return new PartCandidate(deck, "Deck " + deck.toString().charAt(35), system, level, number, "Part " + number,
                newCards, lastStudied);
    }

    private static UUID starterFor(String currentLevel, PartCandidate... parts) {
        return VocabSuggestionServiceImpl.pick(List.of(parts), currentLevel).orElseThrow().deckId();
    }

    @Test
    void neverStudied_suggestsTheFirstPartOfTheFirstSystemDeck() {
        var suggestion = VocabSuggestionServiceImpl.pick(List.of(
                part(DECK_A, false, 1, 20, null),      // bộ của giáo viên đứng trước theo thứ tự hiển thị
                part(DECK_B, true, 1, 15, null),
                part(DECK_B, true, 2, 30, null)), "A1").orElseThrow();

        assertThat(suggestion.deckId()).isEqualTo(DECK_B);
        assertThat(suggestion.partNumber()).isEqualTo(1);
        assertThat(suggestion.continuing()).isFalse();
    }

    @Test
    void aRoundIsAtMostTenCards_andShorterWhenThePartHasFewerNewCards() {
        assertThat(VocabSuggestionServiceImpl.pick(List.of(part(DECK_A, true, 1, 49, null)), "A1").orElseThrow()
                .newCards()).isEqualTo(10);
        assertThat(VocabSuggestionServiceImpl.pick(List.of(part(DECK_A, true, 1, 3, null)), "A1").orElseThrow()
                .newCards()).isEqualTo(3);
    }

    @Test
    void startedDeck_continuesWithTheNextPartThatStillHasNewCards() {
        var suggestion = VocabSuggestionServiceImpl.pick(List.of(
                part(DECK_A, true, 1, 0, NOW.minusSeconds(3600)),   // phần 1 đã học hết
                part(DECK_A, true, 2, 12, NOW.minusSeconds(7200)),
                part(DECK_A, true, 3, 40, null)), "A1").orElseThrow();

        assertThat(suggestion.deckId()).isEqualTo(DECK_A);
        assertThat(suggestion.partNumber()).isEqualTo(2);
        assertThat(suggestion.continuing()).isTrue();
    }

    @Test
    void severalStartedDecks_prefersTheOneStudiedMostRecently() {
        var suggestion = VocabSuggestionServiceImpl.pick(List.of(
                part(DECK_A, true, 1, 5, NOW.minusSeconds(86_400)),
                part(DECK_B, true, 1, 5, NOW.minusSeconds(60)),
                part(DECK_C, true, 1, 5, null)), "A1").orElseThrow();

        assertThat(suggestion.deckId()).isEqualTo(DECK_B);
        assertThat(suggestion.continuing()).isTrue();
    }

    @Test
    void startedDeckWithNothingNewLeft_fallsBackToTheFirstSystemDeckWithNewCards() {
        var suggestion = VocabSuggestionServiceImpl.pick(List.of(
                part(DECK_A, true, 1, 0, NOW),                  // đã học hết bộ này
                part(DECK_B, true, 1, 8, null)), "A1").orElseThrow();

        assertThat(suggestion.deckId()).isEqualTo(DECK_B);
        assertThat(suggestion.continuing()).isFalse();
    }

    @Test
    void onlyTeacherDecksHaveNewCards_stillSuggestsOne() {
        assertThat(VocabSuggestionServiceImpl.pick(List.of(part(DECK_A, false, 1, 6, null)), "A1").orElseThrow()
                .deckId()).isEqualTo(DECK_A);
    }

    @Test
    void nothingLeftToLearn_suggestsNothing() {
        assertThat(VocabSuggestionServiceImpl.pick(List.of(part(DECK_A, true, 1, 0, NOW)), "A1")).isEmpty();
        assertThat(VocabSuggestionServiceImpl.pick(List.of(), "A1")).isEmpty();
    }

    // ---------------------------------------------------------------- bộ khởi đầu theo cấp độ (BR-HT-32, AC-HT-81)

    @Test
    void starterDeck_prefersTheDeckAtTheLearnersLevel_AC_HT_81() {
        assertThat(starterFor("B1",
                leveled(DECK_A, true, "A1", 1, 10, null),
                leveled(DECK_B, true, "B1", 1, 10, null),
                part(DECK_C, true, 1, 10, null))).isEqualTo(DECK_B);
    }

    @Test
    void starterDeck_learnerWithoutPracticeIsTreatedAsA1_AC_HT_81() {
        var parts = new PartCandidate[] {
                leveled(DECK_A, true, "A1", 1, 10, null),
                leveled(DECK_B, true, "B1", 1, 10, null)};
        assertThat(starterFor(null, parts)).isEqualTo(DECK_A);
        assertThat(starterFor("không rõ", parts)).isEqualTo(DECK_A);
    }

    @Test
    void starterDeck_withoutADeckAtTheLevel_takesTheNearestLowerThenTheNearestHigher() {
        // B2 không có: bộ thấp gần nhất (A2) thắng bộ B1... không tồn tại; bộ thấp thắng bộ cao dù bộ cao gần hơn.
        assertThat(starterFor("B2",
                leveled(DECK_A, true, "A1", 1, 10, null),
                leveled(DECK_B, true, "A2", 1, 10, null),
                leveled(DECK_C, true, "C1", 1, 10, null))).isEqualTo(DECK_B);
        assertThat(starterFor("B1",
                leveled(DECK_A, true, "B2", 1, 10, null),
                leveled(DECK_B, true, "A1", 1, 10, null))).isEqualTo(DECK_B);
        // Không có bộ thấp hơn: lấy bộ cao gần nhất.
        assertThat(starterFor("A1",
                leveled(DECK_A, true, "C1", 1, 10, null),
                leveled(DECK_B, true, "B1", 1, 10, null))).isEqualTo(DECK_B);
    }

    @Test
    void starterDeck_unleveledDeckIsTheLastResort_AC_HT_81() {
        assertThat(starterFor("B1",
                part(DECK_A, true, 1, 10, null),
                leveled(DECK_B, true, "C2", 1, 10, null))).isEqualTo(DECK_B);
        assertThat(starterFor("B1", part(DECK_A, true, 1, 10, null))).isEqualTo(DECK_A);
    }

    @Test
    void starterDeck_sameRankPrefersSystemDeckThenDisplayOrder() {
        assertThat(starterFor("B1",
                leveled(DECK_A, false, "B1", 1, 10, null),
                leveled(DECK_B, true, "B1", 1, 10, null),
                leveled(DECK_C, true, "B1", 1, 10, null))).isEqualTo(DECK_B);
        assertThat(starterFor("B1",
                leveled(DECK_A, false, "B1", 1, 10, null),
                leveled(DECK_D, false, "B1", 1, 10, null))).isEqualTo(DECK_A);
    }

    @Test
    void starterDeck_skipsDecksWithoutNewCards_andUsesTheirFirstPartWithNewCards() {
        var suggestion = VocabSuggestionServiceImpl.pick(List.of(
                leveled(DECK_A, true, "B1", 1, 0, null),          // bộ đúng cấp độ nhưng đã hết thẻ Mới
                leveled(DECK_B, true, "A2", 1, 0, null),
                leveled(DECK_B, true, "A2", 2, 9, null)), "B1").orElseThrow();

        assertThat(suggestion.deckId()).isEqualTo(DECK_B);
        assertThat(suggestion.partNumber()).isEqualTo(2);
    }

    @Test
    void startedDeck_winsOverTheLevelRule() {
        // Bộ đang học (đã chấm thẻ) luôn đứng trước, kể cả khi lệch cấp độ.
        var suggestion = VocabSuggestionServiceImpl.pick(List.of(
                leveled(DECK_A, true, "C1", 1, 5, NOW),
                leveled(DECK_B, true, "B1", 1, 5, null)), "B1").orElseThrow();

        assertThat(suggestion.deckId()).isEqualTo(DECK_A);
        assertThat(suggestion.continuing()).isTrue();
    }
}
