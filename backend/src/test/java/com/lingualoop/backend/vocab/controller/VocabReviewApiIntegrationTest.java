package com.lingualoop.backend.vocab.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;
import com.lingualoop.backend.vocab.VocabTestData;

/**
 * Ôn thẻ từ vựng đến hạn (UC-HT-03) trên Postgres thật: hàng đợi gộp mọi bộ (BR-HT-13, BR-HT-14), phiên ôn (BR-HT-15) và
 * chấm từng thẻ qua endpoint trả lời chung. Mỗi test dùng slug riêng và học viên riêng nên không đụng nhau.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class, VocabTestData.class})
class VocabReviewApiIntegrationTest {

    private static final String REVIEW = "/api/v1/vocab/review";

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DictationTestData users;
    @Autowired private VocabTestData vocab;

    private final String base = "zz" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + users.tokenFor(user)));
    }

    private void due(UUID user, UUID card, String status, int repetitions, int intervalDays, String when) {
        vocab.progress(user, card, status, repetitions, intervalDays, "now() + interval '" + when + "'");
    }

    /** Lưu một nghĩa của một từ điển (tuỳ chọn kèm câu của bài học) và trả id thẻ vừa tạo. */
    private UUID save(UUID user, String headword, UUID sentenceId) throws Exception {
        jdbc.update("""
                INSERT INTO dictionary_words (id, headword, ipa_uk, ipa_us, meanings)
                VALUES (?, ?, '/uk/', '/us/', CAST(? AS jsonb))""", UUID.randomUUID(), headword,
                "[{\"no\":1,\"pos\":\"noun\",\"translation_vi\":\"nghĩa\",\"example_en\":\"an example\",\"example_vi\":\"ví dụ\"}]");
        String body = "{\"headword\":\"" + headword + "\",\"meaningNo\":1" + (sentenceId == null ? "" : ",\"sentenceId\":\"" + sentenceId + "\"") + "}";
        as(user, put("/api/v1/vocab/saved-words").contentType(MediaType.APPLICATION_JSON).content(body)).andExpect(status().isOk());
        return jdbc.queryForObject("""
                SELECT s.card_id FROM user_saved_words s JOIN vocab_cards c ON c.id = s.card_id
                WHERE s.user_id = ? AND c.word = ?""", UUID.class, user, headword);
    }

    private UUID openSession(UUID user, String deck) throws Exception {
        String url = REVIEW + "/sessions" + (deck == null ? "" : "?deck=" + deck);
        String body = as(user, post(url)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(body, "$.data.id"));
    }

    private ResultActions grade(UUID user, UUID session, UUID card, int quality) throws Exception {
        String json = "{\"cardId\":\"" + card + "\",\"answerId\":\"" + UUID.randomUUID() + "\",\"mode\":\"flashcard\",\"quality\":" + quality + "}";
        return as(user, post("/api/v1/vocab/sessions/" + session + "/answers").contentType(MediaType.APPLICATION_JSON).content(json));
    }

    // ---------------------------------------------------------------- hàng đợi (BR-HT-13, BR-HT-14)

    @Test
    void queue_mergesEveryDeck_earliestDueFirst_andIncludesNewSavedWords_AC_HT_17() throws Exception {
        List<UUID> cards = vocab.fill(vocab.deck(base, false), 1, 3, base);
        UUID user = users.newUser();
        due(user, cards.get(1), "learning", 1, 1, "-2 days");
        due(user, cards.get(0), "learning", 1, 1, "-3 days");
        due(user, cards.get(2), "learning", 1, 1, "1 day"); // hẹn ngày mai: chưa đến hạn
        UUID saved = save(user, base + "saved", null);

        as(user, get(REVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cards.length()").value(3))
                .andExpect(jsonPath("$.data.cards[0].id").value(cards.get(0).toString()))
                .andExpect(jsonPath("$.data.cards[1].id").value(cards.get(1).toString()))
                .andExpect(jsonPath("$.data.cards[2].id").value(saved.toString()))
                .andExpect(jsonPath("$.data.dueTotal").value(3))
                .andExpect(jsonPath("$.data.deck").doesNotExist());
    }

    @Test
    void queue_isCappedAtFifty_andTheRestComesInTheNextRound_AC_HT_18() throws Exception {
        List<UUID> cards = vocab.fill(vocab.deck(base, false), 7, 10, base);
        UUID user = users.newUser();
        for (int i = 0; i < 70; i++) {
            due(user, cards.get(i), "reviewing", 2, 6, "-" + (100 - i) + " minutes");
        }

        as(user, get(REVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cards.length()").value(50))
                .andExpect(jsonPath("$.data.dueTotal").value(70))
                .andExpect(jsonPath("$.data.cards[0].id").value(cards.get(0).toString()));

        // sau khi chấm 50 thẻ đầu (lịch ôn dời ra xa), lượt tiếp theo có 20 thẻ còn lại
        jdbc.update("UPDATE user_card_progress SET next_review_at = now() + interval '3 days' WHERE user_id = ? AND card_id = ANY (?)",
                user, cards.subList(0, 50).toArray(new UUID[0]));
        as(user, get(REVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cards.length()").value(20))
                .andExpect(jsonPath("$.data.dueTotal").value(20));
    }

    @Test
    void queue_aForgottenCardWaitsTenMinutes_andAMasteredCardComesBackWhenDue_AC_HT_19_AC_HT_20() throws Exception {
        List<UUID> cards = vocab.fill(vocab.deck(base, false), 1, 2, base);
        UUID user = users.newUser();
        due(user, cards.get(0), "learning", 0, 0, "10 minutes");
        due(user, cards.get(1), "mastered", 5, 25, "-1 minute");

        as(user, get(REVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cards.length()").value(1))
                .andExpect(jsonPath("$.data.cards[0].id").value(cards.get(1).toString()))
                .andExpect(jsonPath("$.data.cards[0].status").value("mastered"))
                .andExpect(jsonPath("$.data.cards[0].previews.length()").value(4));
    }

    @Test
    void queue_withNothingDue_reportsWhenTheNextCardIsDue_AC_HT_21() throws Exception {
        List<UUID> cards = vocab.fill(vocab.deck(base, false), 1, 3, base);
        UUID user = users.newUser();
        due(user, cards.get(0), "reviewing", 2, 6, "5 days");
        due(user, cards.get(1), "reviewing", 2, 6, "2 days");

        String body = as(user, get(REVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cards.length()").value(0))
                .andExpect(jsonPath("$.data.dueTotal").value(0)).andReturn().getResponse().getContentAsString();
        Instant next = Instant.parse(JsonPath.read(body, "$.data.nextDueAt"));
        assertThat(Duration.between(Instant.now(), next)).isCloseTo(Duration.ofDays(2), Duration.ofMinutes(1));

        // chưa có thẻ nào được hẹn: không có thời điểm kế tiếp
        as(users.newUser(), get(REVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cards.length()").value(0))
                .andExpect(jsonPath("$.data.nextDueAt").doesNotExist());
    }

    @Test
    void queue_leavesOutUnsavedWords_cardsOfLockedParts_andOtherLearnersCards_AC_HT_23() throws Exception {
        UUID user = users.newUser();
        UUID other = users.newUser();
        UUID kept = save(user, base + "kept", null);
        UUID dropped = save(user, base + "dropped", null);
        String droppedId = jdbc.queryForObject("SELECT id FROM user_saved_words WHERE card_id = ?", String.class, dropped);
        as(user, delete("/api/v1/vocab/saved-words/" + droppedId)).andExpect(status().isOk());

        List<UUID> pro = vocab.fill(vocab.deck(base, true), 3, 2, base);
        for (UUID card : pro) {
            due(user, card, "learning", 1, 1, "-1 day");
            due(other, card, "learning", 1, 1, "-1 day");
        }

        // gói Free chỉ thấy 2 phần đầu của bộ Pro (4 thẻ) và từ đã lưu còn hoạt động
        as(user, get(REVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.dueTotal").value(5))
                .andExpect(jsonPath("$.data.cards[?(@.id=='" + dropped + "')]").isEmpty())
                .andExpect(jsonPath("$.data.cards[?(@.id=='" + kept + "')]").isNotEmpty())
                .andExpect(jsonPath("$.data.cards[?(@.id=='" + pro.get(4) + "')]").isEmpty());
        // gói Pro thấy cả 3 phần; thẻ của học viên khác không lẫn vào
        UUID proUser = users.newProUser();
        for (UUID card : pro) {
            due(proUser, card, "learning", 1, 1, "-1 day");
        }
        as(proUser, get(REVIEW)).andExpect(status().isOk()).andExpect(jsonPath("$.data.dueTotal").value(6));
    }

    @Test
    void queue_ofOneDeck_onlyHasThatDecksDueCards_AC_HT_07() throws Exception {
        List<UUID> a = vocab.fill(vocab.deck(base + "a", false), 1, 5, base + "a");
        List<UUID> b = vocab.fill(vocab.deck(base + "b", false), 1, 3, base + "b");
        UUID user = users.newUser();
        for (int i = 0; i < 4; i++) {
            due(user, a.get(i), "learning", 1, 1, "-1 day");
        }
        due(user, b.get(0), "learning", 1, 1, "-1 day");

        as(user, get(REVIEW + "?deck=" + base + "a")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deck.slug").value(base + "a"))
                .andExpect(jsonPath("$.data.cards.length()").value(4))
                .andExpect(jsonPath("$.data.dueTotal").value(4));
        as(user, get(REVIEW)).andExpect(jsonPath("$.data.dueTotal").value(5));
    }

    @Test
    void queue_ofAnUnknownDeck_is404() throws Exception {
        as(users.newUser(), get(REVIEW + "?deck=no-such-deck")).andExpect(status().isNotFound());
        UUID owner = users.newUser();
        UUID privateDeck = UUID.randomUUID();
        jdbc.update("INSERT INTO vocab_decks (id, owner_id, slug, name, visibility, status) VALUES (?, ?, ?, 'Riêng', 'private', 'APPROVED')",
                privateDeck, owner, base + "-priv");
        as(users.newUser(), get(REVIEW + "?deck=" + base + "-priv")).andExpect(status().isNotFound());
        as(users.newUser(), post(REVIEW + "/sessions?deck=" + base + "-priv")).andExpect(status().isNotFound());
    }

    @Test
    void queue_aSavedWordFromALessonCarriesTheSentenceAndTheLesson_BR_HT_03() throws Exception {
        UUID lesson = users.newLesson(base + "-lesson", false, "APPROVED", false);
        UUID sentence = users.newSentence(lesson, 1, "He went home.", "Anh ấy về nhà.");
        UUID user = users.newUser();
        UUID card = save(user, base + "go", sentence);

        as(user, get(REVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cards[0].id").value(card.toString()))
                .andExpect(jsonPath("$.data.cards[0].contextEn").value("He went home."))
                .andExpect(jsonPath("$.data.cards[0].contextVi").value("Anh ấy về nhà."))
                .andExpect(jsonPath("$.data.cards[0].lesson.slug").value(base + "-lesson"));
    }

    // ---------------------------------------------------------------- phiên và chấm thẻ

    @Test
    void openingAReviewSession_closesTheOneStillOpen_BR_HT_15() throws Exception {
        List<UUID> cards = vocab.fill(vocab.deck(base, false), 1, 1, base);
        UUID user = users.newUser();

        UUID first = openSession(user, null);
        UUID second = openSession(user, base);

        assertThat(jdbc.queryForObject("SELECT ended_at IS NOT NULL FROM vocab_study_sessions WHERE id = ?", Boolean.class, first)).isTrue();
        assertThat(jdbc.queryForMap("SELECT session_type, deck_id, group_id FROM vocab_study_sessions WHERE id = ?", first))
                .containsEntry("session_type", "review").containsEntry("deck_id", null).containsEntry("group_id", null);
        assertThat(jdbc.queryForMap("SELECT session_type, deck_id FROM vocab_study_sessions WHERE id = ?", second))
                .containsEntry("session_type", "review");
        assertThat(jdbc.queryForObject("SELECT d.slug FROM vocab_study_sessions s JOIN vocab_decks d ON d.id = s.deck_id WHERE s.id = ?",
                String.class, second)).isEqualTo(base);
        assertThat(cards).hasSize(1);
    }

    @Test
    void gradingACard_updatesItsScheduleAndTakesItOutOfTheQueue_UC_HT_03() throws Exception {
        List<UUID> cards = vocab.fill(vocab.deck(base, false), 1, 2, base);
        UUID user = users.newUser();
        due(user, cards.get(0), "learning", 1, 1, "-1 day");
        UUID saved = save(user, base + "saved", null);
        UUID session = openSession(user, null);

        grade(user, session, cards.get(0), 4).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("reviewing"))
                .andExpect(jsonPath("$.data.intervalDays").value(6));
        grade(user, session, saved, 1).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("learning"));

        // thẻ vừa chấm Được hẹn 6 ngày sau; thẻ Quên hẹn 10 phút sau: cả hai ra khỏi hàng đợi
        as(user, get(REVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cards.length()").value(0))
                .andExpect(jsonPath("$.data.dueTotal").value(0));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM vocab_review_logs WHERE user_id = ? AND session_id = ?",
                Integer.class, user, session)).isEqualTo(2);
    }

    @Test
    void endpoints_requireLogin() throws Exception {
        mockMvc.perform(get(REVIEW)).andExpect(status().isUnauthorized());
        mockMvc.perform(post(REVIEW + "/sessions")).andExpect(status().isUnauthorized());
    }
}
