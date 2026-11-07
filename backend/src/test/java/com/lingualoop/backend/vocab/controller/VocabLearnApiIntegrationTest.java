package com.lingualoop.backend.vocab.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
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
 * Học từ mới một phần (UC-VOCAB-05) trên Postgres thật: thẻ của phần, phiên học, ghi câu trả lời theo BR-VOCAB-07, 08,
 * 11, 12, 13 và khoá Pro ở server (BR-VOCAB-05). Mỗi test dùng slug riêng nên không đụng nhau.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class, VocabTestData.class})
class VocabLearnApiIntegrationTest {

    private static final String DECKS = "/api/v1/vocab/decks/";
    private static final String SESSIONS = "/api/v1/vocab/sessions/";

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DictationTestData users;
    @Autowired private VocabTestData vocab;

    private final String base = "zz" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + users.tokenFor(user)));
    }

    /** Bộ miễn phí 2 phần x 4 thẻ. */
    private List<UUID> freeDeck() {
        return vocab.fill(vocab.deck(base, false), 2, 4, base);
    }

    private UUID openSession(UUID user, String slug, int part) throws Exception {
        String body = as(user, post(DECKS + slug + "/parts/" + part + "/sessions")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(body, "$.data.id"));
    }

    private ResultActions answer(UUID user, UUID session, UUID card, String mode, boolean correct, Integer quality, UUID answerId)
            throws Exception {
        String json = "{\"cardId\":\"" + card + "\",\"answerId\":\"" + answerId + "\",\"mode\":\"" + mode + "\",\"correct\":"
                + correct + (quality == null ? "" : ",\"quality\":" + quality) + ",\"responseMs\":1200}";
        return as(user, post(SESSIONS + session + "/answers").contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private ResultActions answer(UUID user, UUID session, UUID card, String mode, boolean correct, Integer quality)
            throws Exception {
        return answer(user, session, card, mode, correct, quality, UUID.randomUUID());
    }

    private Map<String, Object> progressOf(UUID user, UUID card) {
        return jdbc.queryForMap("SELECT status, repetitions, interval_days, easiness_factor, next_review_at, "
                + "correct_count, incorrect_count FROM user_card_progress WHERE user_id = ? AND card_id = ?", user, card);
    }

    private int logCount(UUID user, UUID card) {
        return jdbc.queryForObject("SELECT count(*) FROM vocab_review_logs WHERE user_id = ? AND card_id = ?",
                Integer.class, user, card);
    }

    private static Instant instant(Object timestamp) {
        return ((Timestamp) timestamp).toInstant();
    }

    // ---------------------------------------------------------------- thẻ của phần

    @Test
    void part_returnsTheCardsInOrder_withProgressPhoneticsAndPreviews() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        vocab.progress(user, cards.get(1), "reviewing", 2, 6, "now() + interval '6 days'");

        as(user, get(DECKS + base + "/parts/1")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deck.slug").value(base))
                .andExpect(jsonPath("$.data.index").value(0))
                .andExpect(jsonPath("$.data.name").value("Topic 1"))
                .andExpect(jsonPath("$.data.parts.length()").value(2))
                .andExpect(jsonPath("$.data.cards.length()").value(4))
                .andExpect(jsonPath("$.data.cards[0].word").value(base + "w1x1"))
                .andExpect(jsonPath("$.data.cards[0].status").value("new"))
                .andExpect(jsonPath("$.data.cards[0].ipaUs").value("/us/"))
                .andExpect(jsonPath("$.data.cards[0].audioUk").value("https://cdn.example.com/uk.mp3"))
                .andExpect(jsonPath("$.data.cards[0].exampleEn").value("I like " + base + "w1x1."))
                // thẻ Mới: Quên 10 phút, các nút còn lại 1 ngày
                .andExpect(jsonPath("$.data.cards[0].previews[0].quality").value(1))
                .andExpect(jsonPath("$.data.cards[0].previews[0].minutes").value(10))
                .andExpect(jsonPath("$.data.cards[0].previews[2].minutes").value(1440))
                // thẻ đang ôn, khoảng 6 ngày, EF 2,5: nút Được hẹn 15 ngày
                .andExpect(jsonPath("$.data.cards[1].status").value("reviewing"))
                .andExpect(jsonPath("$.data.cards[1].previews[2].quality").value(4))
                .andExpect(jsonPath("$.data.cards[1].previews[2].minutes").value(15 * 24 * 60));
    }

    @Test
    void part_unknownDeckOrPart_is404() throws Exception {
        freeDeck();
        UUID user = users.newUser();
        as(user, get(DECKS + "no-such-deck/parts/1")).andExpect(status().isNotFound());
        as(user, get(DECKS + base + "/parts/0")).andExpect(status().isNotFound());
        as(user, get(DECKS + base + "/parts/3")).andExpect(status().isNotFound());
    }

    @Test
    void part_proDeckLocksPartsFromTheThird_onTheServer_BR_VOCAB_05() throws Exception {
        vocab.fill(vocab.deck(base, true), 4, 3, base);
        UUID free = users.newUser();

        as(free, get(DECKS + base + "/parts/1")).andExpect(status().isOk());
        as(free, get(DECKS + base + "/parts/2")).andExpect(status().isOk());
        as(free, get(DECKS + base + "/parts/3")).andExpect(status().isForbidden());
        as(free, post(DECKS + base + "/parts/3/sessions")).andExpect(status().isForbidden());
        as(users.newProUser(), get(DECKS + base + "/parts/4")).andExpect(status().isOk());
    }

    // ---------------------------------------------------------------- phiên học (BR-VOCAB-11)

    @Test
    void openingASession_closesTheOneStillOpen() throws Exception {
        freeDeck();
        UUID user = users.newUser();

        UUID first = openSession(user, base, 1);
        UUID second = openSession(user, base, 2);

        assertThat(second).isNotEqualTo(first);
        assertThat(jdbc.queryForObject("SELECT ended_at IS NOT NULL FROM vocab_study_sessions WHERE id = ?", Boolean.class, first)).isTrue();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM vocab_study_sessions WHERE user_id = ? AND ended_at IS NULL",
                Integer.class, user)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT session_type FROM vocab_study_sessions WHERE id = ?", String.class, second)).isEqualTo("learn");
    }

    // ---------------------------------------------------------------- câu trả lời

    @Test
    void quizAnswers_moveNewCardsToLearningForOneDay_andLeaveTheRestNew_AC_VOCAB_15() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        UUID session = openSession(user, base, 1);

        answer(user, session, cards.get(0), "quiz", true, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("learning"))
                .andExpect(jsonPath("$.data.intervalDays").value(1));
        answer(user, session, cards.get(1), "quiz", true, null).andExpect(status().isOk());
        answer(user, session, cards.get(2), "quiz", false, null).andExpect(status().isOk());

        for (int i = 0; i < 3; i++) {
            Map<String, Object> progress = progressOf(user, cards.get(i));
            assertThat(progress).containsEntry("status", "learning").containsEntry("repetitions", 1)
                    .containsEntry("interval_days", 1);
            assertThat(Duration.between(Instant.now(), instant(progress.get("next_review_at"))))
                    .isCloseTo(Duration.ofDays(1), Duration.ofMinutes(1));
        }
        assertThat(progressOf(user, cards.get(2))).containsEntry("incorrect_count", 1).containsEntry("correct_count", 0);
        // thẻ thứ tư chưa được trả lời nên vẫn Mới và không có dòng tiến độ
        assertThat(jdbc.queryForObject("SELECT count(*) FROM user_card_progress WHERE user_id = ? AND card_id = ?",
                Integer.class, user, cards.get(3))).isZero();
        assertThat(jdbc.queryForList("SELECT mode, is_correct FROM vocab_review_logs WHERE user_id = ? ORDER BY id", user))
                .extracting(row -> row.get("mode")).containsExactly("quiz", "quiz", "quiz");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM vocab_review_logs WHERE user_id = ? AND session_id = ?",
                Integer.class, user, session)).isEqualTo(3);
    }

    @Test
    void nonFlashcardAnswer_keepsTheScheduleOfAnAlreadyStudiedCard_AC_VOCAB_16() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        vocab.progress(user, cards.get(0), "reviewing", 2, 6, "now() + interval '6 days'");
        Instant before = instant(progressOf(user, cards.get(0)).get("next_review_at"));
        UUID session = openSession(user, base, 1);

        answer(user, session, cards.get(0), "quiz", false, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("reviewing"))
                .andExpect(jsonPath("$.data.intervalDays").value(6));

        Map<String, Object> progress = progressOf(user, cards.get(0));
        assertThat(progress).containsEntry("status", "reviewing").containsEntry("repetitions", 2)
                .containsEntry("interval_days", 6).containsEntry("incorrect_count", 1);
        assertThat(instant(progress.get("next_review_at"))).isEqualTo(before);
        assertThat(logCount(user, cards.get(0))).isEqualTo(1);
    }

    @Test
    void guessReverseQuizAndRepeat_behaveLikeQuiz_BR_VOCAB_08() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        UUID session = openSession(user, base, 1);

        answer(user, session, cards.get(0), "guess", false, null).andExpect(status().isOk());
        answer(user, session, cards.get(1), "reverse_quiz", true, null).andExpect(status().isOk());
        answer(user, session, cards.get(2), "repeat", true, null).andExpect(status().isOk());
        answer(user, session, cards.get(2), "repeat", true, null).andExpect(status().isOk());

        for (int i = 0; i < 3; i++) {
            assertThat(progressOf(user, cards.get(i))).containsEntry("status", "learning").containsEntry("repetitions", 1);
        }
        assertThat(progressOf(user, cards.get(2))).containsEntry("correct_count", 2).containsEntry("interval_days", 1);
        assertThat(jdbc.queryForList("SELECT DISTINCT mode FROM vocab_review_logs WHERE user_id = ? ORDER BY mode", String.class, user))
                .containsExactly("guess", "repeat", "reverse_quiz");
    }

    @Test
    void flashcardGood_onANewCard_followsSm2_AC_VOCAB_17() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        UUID session = openSession(user, base, 1);

        answer(user, session, cards.get(0), "flashcard", false, 4).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("learning"));

        Map<String, Object> progress = progressOf(user, cards.get(0));
        assertThat(progress).containsEntry("status", "learning").containsEntry("repetitions", 1)
                .containsEntry("interval_days", 1).containsEntry("correct_count", 1);
        assertThat(((Number) progress.get("easiness_factor")).doubleValue()).isEqualTo(2.5);
        // flashcard: "đúng" suy ra từ quality, không tin cờ client
        Map<String, Object> log = jdbc.queryForMap("SELECT is_correct, quality FROM vocab_review_logs WHERE user_id = ?", user);
        assertThat(log).containsEntry("is_correct", true);
        assertThat(((Number) log.get("quality")).intValue()).isEqualTo(4);
    }

    @Test
    void flashcardForgot_retriesInTenMinutes_thenGoodStartsOver_BR_VOCAB_07() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        vocab.progress(user, cards.get(0), "reviewing", 3, 15, "now() - interval '1 day'");
        UUID session = openSession(user, base, 1);

        answer(user, session, cards.get(0), "flashcard", true, 1).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("learning"))
                .andExpect(jsonPath("$.data.intervalDays").value(0));
        Map<String, Object> forgot = progressOf(user, cards.get(0));
        assertThat(forgot).containsEntry("repetitions", 0);
        assertThat(Duration.between(Instant.now(), instant(forgot.get("next_review_at"))))
                .isCloseTo(Duration.ofMinutes(10), Duration.ofSeconds(30));
        assertThat(jdbc.queryForObject("SELECT is_correct FROM vocab_review_logs WHERE user_id = ?", Boolean.class, user)).isFalse();

        answer(user, session, cards.get(0), "flashcard", false, 5).andExpect(status().isOk());
        assertThat(progressOf(user, cards.get(0))).containsEntry("repetitions", 1).containsEntry("interval_days", 1);
    }

    @Test
    void flashcardWithoutQuality_is400() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        UUID session = openSession(user, base, 1);

        answer(user, session, cards.get(0), "flashcard", true, null).andExpect(status().isBadRequest());
        assertThat(logCount(user, cards.get(0))).isZero();
    }

    @Test
    void unknownMode_is400() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        UUID session = openSession(user, base, 1);

        answer(user, session, cards.get(0), "telepathy", true, null).andExpect(status().isBadRequest());
    }

    @Test
    void resendingTheSameAnswer_isLoggedAndAppliedOnce_BR_VOCAB_12() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        UUID session = openSession(user, base, 1);
        UUID answerId = UUID.randomUUID();

        answer(user, session, cards.get(0), "flashcard", true, 4, answerId).andExpect(status().isOk());
        answer(user, session, cards.get(0), "flashcard", true, 4, answerId).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("learning"))
                .andExpect(jsonPath("$.data.intervalDays").value(1));

        assertThat(logCount(user, cards.get(0))).isEqualTo(1);
        Map<String, Object> progress = progressOf(user, cards.get(0));
        assertThat(progress).containsEntry("repetitions", 1).containsEntry("correct_count", 1);
    }

    // ---------------------------------------------------------------- quyền (BR-VOCAB-05, BR-VOCAB-13)

    @Test
    void anotherLearnersSession_is404_andWritesNothing_BR_VOCAB_13() throws Exception {
        List<UUID> cards = freeDeck();
        UUID owner = users.newUser();
        UUID intruder = users.newUser();
        UUID session = openSession(owner, base, 1);

        answer(intruder, session, cards.get(0), "quiz", true, null).andExpect(status().isNotFound());
        answer(owner, UUID.randomUUID(), cards.get(0), "quiz", true, null).andExpect(status().isNotFound());

        assertThat(logCount(intruder, cards.get(0))).isZero();
        assertThat(logCount(owner, cards.get(0))).isZero();
    }

    @Test
    void aCardOfAnotherLearnersDeck_is404() throws Exception {
        freeDeck();
        UUID owner = users.newUser();
        UUID other = users.newUser();
        UUID privateDeck = UUID.randomUUID();
        jdbc.update("INSERT INTO vocab_decks (id, owner_id, slug, name, visibility, status) VALUES (?, ?, ?, 'Riêng', 'private', 'APPROVED')",
                privateDeck, owner, base + "-priv");
        UUID card = vocab.card(vocab.group(privateDeck, 1), 1, base + "priv");
        UUID session = openSession(other, base, 1);

        answer(other, session, card, "quiz", true, null).andExpect(status().isNotFound());
        assertThat(logCount(other, card)).isZero();
    }

    @Test
    void answeringACardOfALockedPart_is403_andWritesNothing_BR_VOCAB_05() throws Exception {
        List<UUID> cards = vocab.fill(vocab.deck(base, true), 3, 2, base);
        UUID free = users.newUser();
        UUID session = openSession(free, base, 1);
        UUID locked = cards.get(4); // phần thứ ba

        answer(free, session, locked, "quiz", true, null).andExpect(status().isForbidden());
        answer(free, session, cards.get(0), "quiz", true, null).andExpect(status().isOk());

        assertThat(logCount(free, locked)).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM user_card_progress WHERE user_id = ? AND card_id = ?",
                Integer.class, free, locked)).isZero();
    }

    @Test
    void endpoints_requireLogin() throws Exception {
        mockMvc.perform(get(DECKS + "any/parts/1")).andExpect(status().isUnauthorized());
        mockMvc.perform(post(DECKS + "any/parts/1/sessions")).andExpect(status().isUnauthorized());
        mockMvc.perform(post(SESSIONS + UUID.randomUUID() + "/answers").contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void progressShowsUpInTheDeckList_afterLearning() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        UUID session = openSession(user, base, 1);
        answer(user, session, cards.get(0), "quiz", true, null).andExpect(status().isOk());

        as(user, get(DECKS + base)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deck.progress.learning").value(1))
                .andExpect(jsonPath("$.data.parts[0].studiedCount").value(1))
                .andExpect(jsonPath("$.data.parts[1].studiedCount").value(0));
    }
}
