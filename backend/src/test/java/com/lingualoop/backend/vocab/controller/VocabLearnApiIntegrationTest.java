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
 * Học từ mới một phần (UC-HT-02) trên Postgres thật: thẻ của phần, phiên học, ghi câu trả lời theo BR-HT-10, BR-HT-11, 08,
 * 11, 12, 13 và khoá Pro ở server (BR-HT-07). Mỗi test dùng bộ riêng nên không đụng nhau.
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

    private UUID openSession(UUID user, String prefix, int part) throws Exception {
        String body = as(user, post(DECKS + VocabTestData.idOf(prefix) + "/parts/" + part + "/sessions")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(body, "$.data.id"));
    }

    private ResultActions answer(UUID user, UUID session, UUID card, String mode, boolean correct, boolean hintUsed,
            Integer quality, UUID answerId) throws Exception {
        String json = "{\"cardId\":\"" + card + "\",\"answerId\":\"" + answerId + "\",\"mode\":\"" + mode + "\",\"correct\":"
                + correct + ",\"hintUsed\":" + hintUsed + (quality == null ? "" : ",\"quality\":" + quality) + ",\"responseMs\":1200}";
        return as(user, post(SESSIONS + session + "/answers").contentType(MediaType.APPLICATION_JSON).content(json));
    }

    private ResultActions answer(UUID user, UUID session, UUID card, String mode, boolean correct, Integer quality, UUID answerId)
            throws Exception {
        return answer(user, session, card, mode, correct, false, quality, answerId);
    }

    private ResultActions answer(UUID user, UUID session, UUID card, String mode, boolean correct, Integer quality)
            throws Exception {
        return answer(user, session, card, mode, correct, false, quality, UUID.randomUUID());
    }

    private Map<String, Object> progressOf(UUID user, UUID card) {
        return jdbc.queryForMap("SELECT CASE WHEN interval_days >= 21 THEN 'mastered' WHEN repetitions < 2 THEN 'learning' "
                + "ELSE 'reviewing' END AS status, repetitions, interval_days, ease_factor AS easiness_factor, "
                + "due_at AS next_review_at FROM user_card_progress WHERE user_id = ? AND card_id = ?", user, card);
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
        vocab.progress(user, cards.get(1), 2, 6, "now() + interval '6 days'");

        as(user, get(DECKS + VocabTestData.idOf(base) + "/parts/1")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deck.id").value(VocabTestData.idOf(base).toString()))
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
        as(user, get(DECKS + UUID.randomUUID() + "/parts/1")).andExpect(status().isNotFound());
        as(user, get(DECKS + VocabTestData.idOf(base) + "/parts/0")).andExpect(status().isNotFound());
        as(user, get(DECKS + VocabTestData.idOf(base) + "/parts/3")).andExpect(status().isNotFound());
    }

    @Test
    void part_proDeckIsLockedForAFreeUser_onTheServer_BR_HT_07() throws Exception {
        vocab.fill(vocab.deck(base, true), 4, 3, base);
        UUID free = users.newUser();

        for (int part = 1; part <= 4; part++) {
            as(free, get(DECKS + VocabTestData.idOf(base) + "/parts/" + part)).andExpect(status().isForbidden());
            as(free, post(DECKS + VocabTestData.idOf(base) + "/parts/" + part + "/sessions")).andExpect(status().isForbidden());
        }
        as(users.newProUser(), get(DECKS + VocabTestData.idOf(base) + "/parts/1")).andExpect(status().isOk());
        as(users.newProUser(), get(DECKS + VocabTestData.idOf(base) + "/parts/4")).andExpect(status().isOk());
    }

    // ---------------------------------------------------------------- phiên học (BR-HT-15)

    @Test
    void openingASession_closesTheOneStillOpen() throws Exception {
        freeDeck();
        UUID user = users.newUser();

        UUID first = openSession(user, base, 1);
        UUID second = openSession(user, base, 2);

        assertThat(second).isNotEqualTo(first);
        assertThat(jdbc.queryForObject("SELECT ended_at IS NOT NULL FROM vocab_sessions WHERE id = ?", Boolean.class, first)).isTrue();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM vocab_sessions WHERE user_id = ? AND ended_at IS NULL",
                Integer.class, user)).isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT kind FROM vocab_sessions WHERE id = ?", String.class, second)).isEqualTo("learn");
    }

    // ---------------------------------------------------------------- câu trả lời

    @Test
    void correctQuizAnswers_gradeGood_newCardsGoToLearningOneDay_AC_HT_09() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        // Thẻ B đang Đang học với 1 lần nhớ liên tiếp
        vocab.progress(user, cards.get(1), 1, 1, "now() + interval '1 day'");
        UUID session = openSession(user, base, 1);

        answer(user, session, cards.get(0), "quiz", true, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("learning"))
                .andExpect(jsonPath("$.data.intervalDays").value(1))
                .andExpect(jsonPath("$.data.quality").value(4));
        answer(user, session, cards.get(1), "quiz", true, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("reviewing"))
                .andExpect(jsonPath("$.data.intervalDays").value(6));

        Map<String, Object> a = progressOf(user, cards.get(0));
        assertThat(a).containsEntry("status", "learning").containsEntry("repetitions", 1).containsEntry("interval_days", 1);
        assertThat(Duration.between(Instant.now(), instant(a.get("next_review_at"))))
                .isCloseTo(Duration.ofDays(1), Duration.ofMinutes(1));
        Map<String, Object> b = progressOf(user, cards.get(1));
        assertThat(b).containsEntry("status", "reviewing").containsEntry("repetitions", 2).containsEntry("interval_days", 6);
        // thẻ chưa được trả lời vẫn Mới và không có dòng tiến độ
        assertThat(jdbc.queryForObject("SELECT count(*) FROM user_card_progress WHERE user_id = ? AND card_id = ?",
                Integer.class, user, cards.get(3))).isZero();
        assertThat(jdbc.queryForList("SELECT mode, quality FROM vocab_review_logs WHERE user_id = ? ORDER BY id", user))
                .allSatisfy(row -> {
                    assertThat(row.get("mode")).isEqualTo("quiz");
                    assertThat(((Number) row.get("quality")).intValue()).isEqualTo(4);
                });
        assertThat(jdbc.queryForObject("SELECT count(*) FROM vocab_review_logs WHERE user_id = ? AND session_id = ?",
                Integer.class, user, session)).isEqualTo(2);
    }

    @Test
    void wrongAnswer_gradesForgot_resetsTheCardToTenMinutes_AC_HT_10() throws Exception {
        for (String mode : new String[] {"quiz", "reverse_quiz", "guess"}) {
            List<UUID> cards = vocab.fill(vocab.deck(base + mode.charAt(0), false), 1, 2, base + mode.charAt(0));
            UUID user = users.newUser();
            vocab.progress(user, cards.get(0), 2, 6, "now() + interval '6 days'");
            UUID session = openSession(user, base + mode.charAt(0), 1);

            answer(user, session, cards.get(0), mode, false, null).andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.status").value("learning"))
                    .andExpect(jsonPath("$.data.intervalDays").value(0))
                    .andExpect(jsonPath("$.data.quality").value(1));

            Map<String, Object> progress = progressOf(user, cards.get(0));
            assertThat(progress).containsEntry("status", "learning").containsEntry("repetitions", 0);
            assertThat(Duration.between(Instant.now(), instant(progress.get("next_review_at"))))
                    .isCloseTo(Duration.ofMinutes(10), Duration.ofSeconds(30));
            Map<String, Object> log = jdbc.queryForMap("SELECT is_correct, quality FROM vocab_review_logs WHERE user_id = ?", user);
            assertThat(log).containsEntry("is_correct", false);
            assertThat(((Number) log.get("quality")).intValue()).isEqualTo(1);
        }
    }

    @Test
    void guessWithAHint_gradesHard_andAnswerWithoutHintGradesGood_AC_HT_13() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        UUID session = openSession(user, base, 1);

        answer(user, session, cards.get(0), "guess", true, true, null, UUID.randomUUID()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.quality").value(3));
        answer(user, session, cards.get(1), "guess", true, false, null, UUID.randomUUID()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.quality").value(4));
        answer(user, session, cards.get(2), "guess", false, true, null, UUID.randomUUID()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.quality").value(1));

        assertThat(jdbc.queryForList("SELECT quality FROM vocab_review_logs WHERE user_id = ? ORDER BY id", Integer.class, user))
                .containsExactly(3, 4, 1);
        assertThat(progressOf(user, cards.get(0))).containsEntry("status", "learning").containsEntry("repetitions", 1);
        assertThat(((Number) progressOf(user, cards.get(0)).get("easiness_factor")).doubleValue()).isEqualTo(2.36);
    }

    @Test
    void flagsMayBeOmitted_asTheClientDoesForQuizAndFlashcard() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        UUID session = openSession(user, base, 1);

        // Trắc nghiệm không gửi hintUsed; Flashcard không gửi correct lẫn hintUsed
        as(user, post(SESSIONS + session + "/answers").contentType(MediaType.APPLICATION_JSON).content(
                "{\"cardId\":\"" + cards.get(0) + "\",\"answerId\":\"" + UUID.randomUUID() + "\",\"mode\":\"quiz\",\"correct\":true}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.quality").value(4));
        as(user, post(SESSIONS + session + "/answers").contentType(MediaType.APPLICATION_JSON).content(
                "{\"cardId\":\"" + cards.get(1) + "\",\"answerId\":\"" + UUID.randomUUID() + "\",\"mode\":\"flashcard\",\"quality\":5}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.quality").value(5));
        // không gửi cờ nào ở cách học không phải Flashcard: tính như sai
        as(user, post(SESSIONS + session + "/answers").contentType(MediaType.APPLICATION_JSON).content(
                "{\"cardId\":\"" + cards.get(2) + "\",\"answerId\":\"" + UUID.randomUUID() + "\",\"mode\":\"guess\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.quality").value(1));
    }

    @Test
    void repeatMode_isNoLongerAccepted_UC_HT_02() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        UUID session = openSession(user, base, 1);

        answer(user, session, cards.get(0), "repeat", true, null).andExpect(status().isBadRequest());
        assertThat(logCount(user, cards.get(0))).isZero();
    }

    @Test
    void flashcardGood_onANewCard_followsSm2_AC_HT_11() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        UUID session = openSession(user, base, 1);

        answer(user, session, cards.get(0), "flashcard", false, 4).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("learning"));

        Map<String, Object> progress = progressOf(user, cards.get(0));
        assertThat(progress).containsEntry("status", "learning").containsEntry("repetitions", 1)
                .containsEntry("interval_days", 1);
        assertThat(((Number) progress.get("easiness_factor")).doubleValue()).isEqualTo(2.5);
        // flashcard: "đúng" suy ra từ quality, không tin cờ client
        Map<String, Object> log = jdbc.queryForMap("SELECT is_correct, quality FROM vocab_review_logs WHERE user_id = ?", user);
        assertThat(log).containsEntry("is_correct", true);
        assertThat(((Number) log.get("quality")).intValue()).isEqualTo(4);
    }

    @Test
    void flashcardForgot_retriesInTenMinutes_thenGoodStartsOver_BR_HT_11() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        vocab.progress(user, cards.get(0), 3, 15, "now() - interval '1 day'");
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
    void flashcardQualityOutsideTheFourButtons_is400() throws Exception {
        List<UUID> cards = freeDeck();
        UUID user = users.newUser();
        UUID session = openSession(user, base, 1);

        // chỉ có Quên (1), Khó (3), Được (4), Dễ (5); bảng nhật ký không nhận mức khác
        answer(user, session, cards.get(0), "flashcard", true, 2).andExpect(status().isBadRequest());
        answer(user, session, cards.get(0), "flashcard", true, 0).andExpect(status().isBadRequest());
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
    void resendingTheSameAnswer_isLoggedAndAppliedOnce_BR_HT_16() throws Exception {
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
        assertThat(progress).containsEntry("repetitions", 1);
    }

    // ---------------------------------------------------------------- quyền (BR-HT-07, BR-HT-06)

    @Test
    void anotherLearnersSession_is404_andWritesNothing_BR_HT_06() throws Exception {
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
        jdbc.update("INSERT INTO vocab_decks (id, owner_id, kind, name) VALUES (?, ?, 'personal', 'Riêng')",
                privateDeck, owner);
        UUID card = vocab.card(vocab.group(privateDeck, 1), 1, base + "priv");
        UUID session = openSession(other, base, 1);

        answer(other, session, card, "quiz", true, null).andExpect(status().isNotFound());
        assertThat(logCount(other, card)).isZero();
    }

    @Test
    void answeringACardOfAProDeck_is403_forAFreeUser_andWritesNothing_BR_HT_07() throws Exception {
        List<UUID> cards = vocab.fill(vocab.deck(base + "p", true), 3, 2, base + "p");
        List<UUID> free = freeDeck();
        UUID user = users.newUser();
        UUID session = openSession(user, base, 1);
        UUID locked = cards.get(0);

        answer(user, session, locked, "quiz", true, null).andExpect(status().isForbidden());
        answer(user, session, free.get(0), "quiz", true, null).andExpect(status().isOk());

        assertThat(logCount(user, locked)).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM user_card_progress WHERE user_id = ? AND card_id = ?",
                Integer.class, user, locked)).isZero();
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

        as(user, get(DECKS + VocabTestData.idOf(base))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deck.progress.learning").value(1))
                .andExpect(jsonPath("$.data.parts[0].studiedCount").value(1))
                .andExpect(jsonPath("$.data.parts[1].studiedCount").value(0));
    }
}
