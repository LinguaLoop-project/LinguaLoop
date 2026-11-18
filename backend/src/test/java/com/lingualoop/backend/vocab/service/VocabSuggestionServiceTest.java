package com.lingualoop.backend.vocab.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;

import com.lingualoop.backend.vocab.repository.VocabSuggestionRepository.PartCandidate;

/** Chọn phần từ mới gợi ý khi học viên không còn gì để ôn. */
class VocabSuggestionServiceTest {

    private static final UUID DECK_A = UUID.fromString("00000000-0000-0000-0000-00000000000a");
    private static final UUID DECK_B = UUID.fromString("00000000-0000-0000-0000-00000000000b");
    private static final UUID DECK_C = UUID.fromString("00000000-0000-0000-0000-00000000000c");
    private static final Instant NOW = Instant.parse("2026-11-17T08:00:00Z");

    private static PartCandidate part(UUID deck, boolean system, int number, int newCards, Instant lastStudied) {
        return new PartCandidate(deck, "Deck " + deck.toString().charAt(35), system, number, "Part " + number, newCards, lastStudied);
    }

    @Test
    void neverStudied_suggestsTheFirstPartOfTheFirstSystemDeck() {
        var suggestion = VocabSuggestionServiceImpl.pick(List.of(
                part(DECK_A, false, 1, 20, null),      // bộ của giáo viên đứng trước theo thứ tự hiển thị
                part(DECK_B, true, 1, 15, null),
                part(DECK_B, true, 2, 30, null))).orElseThrow();

        assertThat(suggestion.deckId()).isEqualTo(DECK_B);
        assertThat(suggestion.partNumber()).isEqualTo(1);
        assertThat(suggestion.continuing()).isFalse();
    }

    @Test
    void aRoundIsAtMostTenCards_andShorterWhenThePartHasFewerNewCards() {
        assertThat(VocabSuggestionServiceImpl.pick(List.of(part(DECK_A, true, 1, 49, null))).orElseThrow().newCards())
                .isEqualTo(10);
        assertThat(VocabSuggestionServiceImpl.pick(List.of(part(DECK_A, true, 1, 3, null))).orElseThrow().newCards())
                .isEqualTo(3);
    }

    @Test
    void startedDeck_continuesWithTheNextPartThatStillHasNewCards() {
        var suggestion = VocabSuggestionServiceImpl.pick(List.of(
                part(DECK_A, true, 1, 0, NOW.minusSeconds(3600)),   // phần 1 đã học hết
                part(DECK_A, true, 2, 12, NOW.minusSeconds(7200)),
                part(DECK_A, true, 3, 40, null))).orElseThrow();

        assertThat(suggestion.deckId()).isEqualTo(DECK_A);
        assertThat(suggestion.partNumber()).isEqualTo(2);
        assertThat(suggestion.continuing()).isTrue();
    }

    @Test
    void severalStartedDecks_prefersTheOneStudiedMostRecently() {
        var suggestion = VocabSuggestionServiceImpl.pick(List.of(
                part(DECK_A, true, 1, 5, NOW.minusSeconds(86_400)),
                part(DECK_B, true, 1, 5, NOW.minusSeconds(60)),
                part(DECK_C, true, 1, 5, null))).orElseThrow();

        assertThat(suggestion.deckId()).isEqualTo(DECK_B);
        assertThat(suggestion.continuing()).isTrue();
    }

    @Test
    void startedDeckWithNothingNewLeft_fallsBackToTheFirstSystemDeckWithNewCards() {
        var suggestion = VocabSuggestionServiceImpl.pick(List.of(
                part(DECK_A, true, 1, 0, NOW),                  // đã học hết bộ này
                part(DECK_B, true, 1, 8, null))).orElseThrow();

        assertThat(suggestion.deckId()).isEqualTo(DECK_B);
        assertThat(suggestion.continuing()).isFalse();
    }

    @Test
    void onlyTeacherDecksHaveNewCards_stillSuggestsOne() {
        assertThat(VocabSuggestionServiceImpl.pick(List.of(part(DECK_A, false, 1, 6, null))).orElseThrow().deckId())
                .isEqualTo(DECK_A);
    }

    @Test
    void nothingLeftToLearn_suggestsNothing() {
        assertThat(VocabSuggestionServiceImpl.pick(List.of(part(DECK_A, true, 1, 0, NOW)))).isEmpty();
        assertThat(VocabSuggestionServiceImpl.pick(List.of())).isEmpty();
    }
}
