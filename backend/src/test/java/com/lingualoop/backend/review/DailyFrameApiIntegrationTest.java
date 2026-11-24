package com.lingualoop.backend.review;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;

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
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.practice.AttemptTestData;
import com.lingualoop.backend.vocab.VocabTestData;

/**
 * Khung bài ngày (BR-HT-29, BR-HT-30) trên Postgres thật: phần thẻ của phiên Ôn tập hằng ngày được lấp bằng thẻ đến hạn,
 * rồi từ mới, rồi thẻ củng cố. Các test dùng chung một cơ sở dữ liệu nên mỗi test cho học viên "đang học" đúng một bộ để bộ
 * từ mới không phụ thuộc bộ của test khác.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class, AttemptTestData.class, VocabTestData.class})
class DailyFrameApiIntegrationTest {

    private static final String PLAN = "/api/v1/review/daily-plan";
    private static final String CARDS = "/api/v1/review/daily-cards";

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DictationTestData users;
    @Autowired private VocabTestData vocab;
    @Autowired private AttemptTestData attempts;
    @Autowired private LessonFixtures lessonFixtures;

    private final String base = "zf" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    private int deckSeq;

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + users.tokenFor(user)));
    }

    /** Học viên mục tiêu 15 phút: định mức 20 thẻ, tối đa 7 từ mới mỗi ngày. */
    private UUID student() {
        UUID user = users.newUser();
        jdbc.update("UPDATE users SET daily_minutes = 15 WHERE id = ?", user);
        return user;
    }

    private String prefix(String kind) {
        return base + kind + (++deckSeq);
    }

    /** {@code count} thẻ đến hạn của {@code user} trong một bộ riêng. */
    private List<UUID> dueCards(UUID user, int count) {
        String prefix = prefix("d");
        List<UUID> cards = vocab.fill(vocab.deck(prefix, false), 1, count, prefix);
        for (UUID card : cards) {
            vocab.progress(user, card, 2, 6, "now() - interval '5 minutes'");
        }
        return cards;
    }

    /** {@code count} thẻ hẹn ôn sau {@code days} ngày, đã nhớ 2 lần liên tiếp nên không phải thẻ củng cố. */
    private List<UUID> scheduledCards(UUID user, int count, String when) {
        String prefix = prefix("s");
        List<UUID> cards = vocab.fill(vocab.deck(prefix, false), 1, count, prefix);
        for (UUID card : cards) {
            vocab.progress(user, card, 2, 6, "now() + interval '" + when + "'");
        }
        return cards;
    }

    /** {@code count} thẻ Đang học (nhớ 1 lần) hệ số dễ thấp, hẹn sau 5 ngày: thẻ củng cố (BR-HT-30). */
    private List<UUID> weakCards(UUID user, int count) {
        String prefix = prefix("w");
        List<UUID> cards = vocab.fill(vocab.deck(prefix, false), 1, count, prefix);
        for (UUID card : cards) {
            vocab.progress(user, card, 1, 1, "now() + interval '5 days'");
            jdbc.update("UPDATE user_card_progress SET ease_factor = 1.5 WHERE user_id = ? AND card_id = ?", user, card);
        }
        return cards;
    }

    /**
     * Bộ học viên đang học: một thẻ đã học (hẹn sau 5 ngày, Đang học) và {@code newCards} thẻ Mới. Trả id bộ; thẻ đã học là
     * thẻ đầu của bộ và học lúc {@code studiedAgo} trước.
     */
    private UUID studiedDeck(UUID user, boolean pro, int newCards, String studiedAgo) {
        String prefix = prefix("f");
        UUID deck = vocab.deck(prefix, pro);
        UUID group = vocab.group(deck, 1);
        UUID learned = vocab.card(group, 1, prefix + "learned");
        for (int i = 2; i <= newCards + 1; i++) {
            vocab.card(group, i, prefix + "n" + i);
        }
        vocab.progress(user, learned, 1, 1, "now() + interval '5 days'");
        jdbc.update("UPDATE user_card_progress SET updated_at = now() - ?::interval WHERE user_id = ? AND card_id = ?",
                studiedAgo, user, learned);
        return deck;
    }

    /** Ghi {@code cards} đã chấm trong một lượt {@code kind} cách đây {@code ago}, hẹn lại ngày mai như khi chấm thật. */
    private void answered(UUID user, List<UUID> cards, String kind, String ago) {
        UUID session = jdbc.queryForObject("INSERT INTO vocab_sessions (user_id, kind) VALUES (?, ?) RETURNING id",
                UUID.class, user, kind);
        for (UUID card : cards) {
            jdbc.update("INSERT INTO vocab_review_logs (user_id, card_id, session_id, mode, is_correct, quality, "
                    + "client_request_id, created_at) VALUES (?, ?, ?, 'flashcard', true, 4, ?, now() - ?::interval)",
                    user, card, session, UUID.randomUUID(), ago);
        }
    }

    private Map<String, Object> sources(UUID user) throws Exception {
        String body = as(user, get(PLAN)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.data.cardSources");
    }

    private List<Map<String, Object>> items(UUID user) throws Exception {
        String body = as(user, get(CARDS)).andExpect(status().isOk()).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.data.cards");
    }

    private static String idOf(Map<String, Object> item) {
        return (String) ((Map<?, ?>) item.get("card")).get("id");
    }

    private static Set<String> ids(List<UUID> cards) {
        return cards.stream().map(UUID::toString).collect(Collectors.toSet());
    }

    // ---------------------------------------------------------------- AC-HT-76

    @Test
    void fewDueCards_areFilledWithNewWordsThenTheWeakestCards_AC_HT_76() throws Exception {
        UUID user = student();
        List<UUID> due = dueCards(user, 3);
        UUID deck = studiedDeck(user, false, 40, "1 hour");
        List<UUID> weak = weakCards(user, 15);

        as(user, get(PLAN)).andExpect(jsonPath("$.data.cardsDue").value(3))
                .andExpect(jsonPath("$.data.cardsInPlan").value(20))
                .andExpect(jsonPath("$.data.cardSources.due").value(3))
                .andExpect(jsonPath("$.data.cardSources.newWords").value(7))
                .andExpect(jsonPath("$.data.cardSources.reinforce").value(10))
                .andExpect(jsonPath("$.data.cardsTarget").value(20))
                .andExpect(jsonPath("$.data.suggestions").doesNotExist());

        List<Map<String, Object>> items = items(user);
        assertThat(items).hasSize(20);
        assertThat(items.subList(0, 3)).allSatisfy(i -> assertThat(i.get("source")).isEqualTo("DUE"));
        assertThat(items.subList(0, 3).stream().map(DailyFrameApiIntegrationTest::idOf).collect(Collectors.toSet()))
                .isEqualTo(ids(due));
        assertThat(items.subList(3, 10)).allSatisfy(i -> assertThat(i.get("source")).isEqualTo("NEW_WORD"));
        // 7 từ mới đầu tiên của bộ đang học, theo thứ tự thêm, bỏ thẻ đã học
        List<String> newWords = jdbc.queryForList("""
                SELECT c.id FROM vocab_cards c
                WHERE c.deck_id = ? AND NOT EXISTS (SELECT 1 FROM user_card_progress p
                                                    WHERE p.card_id = c.id AND p.user_id = ?)
                ORDER BY c.created_at, c.id LIMIT 7""", String.class, deck, user);
        assertThat(items.subList(3, 10).stream().map(DailyFrameApiIntegrationTest::idOf).toList()).isEqualTo(newWords);
        assertThat(items.subList(10, 20)).allSatisfy(i -> assertThat(i.get("source")).isEqualTo("REINFORCE"));
        assertThat(ids(weak)).containsAll(items.subList(10, 20).stream().map(DailyFrameApiIntegrationTest::idOf).toList());
    }

    // ---------------------------------------------------------------- AC-HT-77

    @Test
    void newWordsAlreadyStartedToday_useUpTheDailyLimit_AC_HT_77() throws Exception {
        UUID user = student();
        UUID deck = studiedDeck(user, false, 30, "1 hour");
        // 7 từ mới đã được chấm trong lượt ôn hôm nay: lần chấm đầu tiên của chúng là hôm nay
        List<UUID> started = jdbc.queryForList("""
                SELECT c.id FROM vocab_cards c WHERE c.deck_id = ? ORDER BY c.created_at, c.id OFFSET 1 LIMIT 7""",
                UUID.class, deck);
        for (UUID card : started) {
            vocab.progress(user, card, 1, 1, "now() + interval '1 day'");
        }
        answered(user, started, "review", "1 second");

        Map<String, Object> sources = sources(user);

        assertThat(sources.get("newWords")).isEqualTo(0);
    }

    @Test
    void newWordsShrinkWhenTomorrowAlreadyHasManyCards_AC_HT_77() throws Exception {
        UUID user = student();
        studiedDeck(user, false, 30, "1 hour");
        scheduledCards(user, 18, "1 day");              // 18 thẻ đã hẹn vào ngày mai: giới hạn còn 20 - 18 = 2

        Map<String, Object> sources = sources(user);

        assertThat(sources.get("newWords")).isEqualTo(2);
        assertThat(items(user).stream().filter(i -> "NEW_WORD".equals(i.get("source")))).hasSize(2);
    }

    @Test
    void newWordsLearnedOnTheLearnPage_doNotUseUpTheDailyLimit_AC_HT_77() throws Exception {
        UUID user = student();
        UUID deck = studiedDeck(user, false, 30, "1 hour");
        List<UUID> learnedToday = jdbc.queryForList("""
                SELECT c.id FROM vocab_cards c WHERE c.deck_id = ? ORDER BY c.created_at, c.id OFFSET 1 LIMIT 7""",
                UUID.class, deck);
        for (UUID card : learnedToday) {
            vocab.progress(user, card, 1, 1, "now() + interval '1 day'");
        }
        answered(user, learnedToday, "learn", "1 second");   // lượt học ở trang Học từ mới, không phải lượt ôn

        assertThat(sources(user).get("newWords")).isEqualTo(7);
    }

    // ---------------------------------------------------------------- AC-HT-78

    private UUID openReviewSession(UUID user) throws Exception {
        String body = as(user, post("/api/v1/vocab/review/sessions")).andExpect(status().isOk()).andReturn()
                .getResponse().getContentAsString();
        return UUID.fromString(JsonPath.read(body, "$.data.id"));
    }

    private ResultActions grade(UUID user, UUID session, UUID card, boolean practice) throws Exception {
        String json = "{\"cardId\":\"" + card + "\",\"answerId\":\"" + UUID.randomUUID()
                + "\",\"mode\":\"flashcard\",\"quality\":4,\"practice\":" + practice + "}";
        return as(user, post("/api/v1/vocab/sessions/" + session + "/answers").contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    private Map<String, Object> progressOf(UUID user, UUID card) {
        return jdbc.queryForMap("SELECT repetitions, interval_days, ease_factor, due_at FROM user_card_progress "
                + "WHERE user_id = ? AND card_id = ?", user, card);
    }

    @Test
    void reinforcementAnswer_isLoggedButLeavesTheScheduleUntouched_AC_HT_78() throws Exception {
        UUID user = student();
        String prefix = prefix("r");
        UUID card = vocab.fill(vocab.deck(prefix, false), 1, 1, prefix).get(0);
        vocab.progress(user, card, 1, 3, "now() + interval '3 days'");
        jdbc.update("UPDATE user_card_progress SET ease_factor = 1.96 WHERE user_id = ? AND card_id = ?", user, card);
        Map<String, Object> before = progressOf(user, card);

        // Trước khi luyện: thẻ là thẻ củng cố trong phiên
        assertThat(items(user).stream().filter(i -> card.toString().equals(idOf(i)))
                .map(i -> i.get("source")).toList()).containsExactly("REINFORCE");

        grade(user, openReviewSession(user), card, true).andExpect(status().isOk());

        assertThat(progressOf(user, card)).isEqualTo(before);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM vocab_review_logs WHERE user_id = ? AND card_id = ?",
                Integer.class, user, card)).isEqualTo(1);
        // Đã chấm hôm nay thì không được chọn lại làm thẻ củng cố
        assertThat(items(user).stream().map(DailyFrameApiIntegrationTest::idOf)).doesNotContain(card.toString());
        // Nhưng vẫn được tính là một thẻ đã ôn hôm nay
        as(user, get(PLAN)).andExpect(jsonPath("$.data.cardsDoneToday").value(1));
    }

    @Test
    void practiceFlagIsIgnoredForDueAndNewCards_theyAreGradedNormally_AC_HT_78() throws Exception {
        UUID user = student();
        String prefix = prefix("p");
        List<UUID> cards = vocab.fill(vocab.deck(prefix, false), 1, 2, prefix);
        UUID due = cards.get(0);
        UUID fresh = cards.get(1);
        vocab.progress(user, due, 2, 6, "now() - interval '1 day'");
        Map<String, Object> before = progressOf(user, due);
        UUID session = openReviewSession(user);

        grade(user, session, due, true).andExpect(status().isOk());
        grade(user, session, fresh, true).andExpect(status().isOk());

        // Thẻ đã đến hạn vẫn được chấm: lịch dời ra sau; thẻ Mới vẫn có tiến độ sau câu trả lời đầu tiên
        assertThat(((Timestamp) progressOf(user, due).get("due_at")).after((Timestamp) before.get("due_at"))).isTrue();
        assertThat(progressOf(user, due).get("repetitions")).isEqualTo(3);
        assertThat(progressOf(user, fresh).get("repetitions")).isEqualTo(1);
    }

    // ---------------------------------------------------------------- AC-HT-80 (phần thẻ)

    @Test
    void freeLearnerNeverGetsProCards_whileProLearnerDoes_AC_HT_80() throws Exception {
        UUID free = student();
        UUID pro = users.newProUser();
        // Mỗi người đã học một thẻ của bộ miễn phí (lâu hơn) và một thẻ của bộ Pro (gần đây hơn)
        List<UUID> freeDecks = new ArrayList<>();
        List<UUID> proDecks = new ArrayList<>();
        for (UUID user : List.of(free, pro)) {
            freeDecks.add(studiedDeck(user, false, 10, "3 days"));
            proDecks.add(studiedDeck(user, true, 10, "1 hour"));
        }

        List<Map<String, Object>> freeItems = items(free);
        List<String> freeProCards = jdbc.queryForList(
                "SELECT c.id FROM vocab_cards c WHERE c.deck_id = ?", String.class, proDecks.get(0));
        assertThat(freeItems.stream().map(DailyFrameApiIntegrationTest::idOf)).doesNotContainAnyElementsOf(freeProCards);
        List<String> freeNew = freeItems.stream().filter(i -> "NEW_WORD".equals(i.get("source")))
                .map(DailyFrameApiIntegrationTest::idOf).toList();
        assertThat(freeNew).isNotEmpty();
        assertThat(jdbc.queryForList("SELECT DISTINCT deck_id FROM vocab_cards WHERE id IN ("
                + freeNew.stream().map(id -> "'" + id + "'").collect(Collectors.joining(",")) + ")", UUID.class))
                .containsExactly(freeDecks.get(0));

        // Học viên Pro đang học bộ Pro gần nhất: từ mới và thẻ củng cố đều có thẻ của bộ đó
        List<Map<String, Object>> proItems = items(pro);
        List<String> proNew = proItems.stream().filter(i -> "NEW_WORD".equals(i.get("source")))
                .map(DailyFrameApiIntegrationTest::idOf).toList();
        assertThat(proNew).isNotEmpty();
        assertThat(jdbc.queryForList("SELECT DISTINCT deck_id FROM vocab_cards WHERE id IN ("
                + proNew.stream().map(id -> "'" + id + "'").collect(Collectors.joining(",")) + ")", UUID.class))
                .containsExactly(proDecks.get(1));
        List<String> proProCards = jdbc.queryForList(
                "SELECT c.id FROM vocab_cards c WHERE c.deck_id = ?", String.class, proDecks.get(1));
        assertThat(proItems.stream().filter(i -> "REINFORCE".equals(i.get("source"))).map(DailyFrameApiIntegrationTest::idOf))
                .anyMatch(proProCards::contains);
    }

    // ---------------------------------------------------------------- AC-HT-81

    @Test
    void neverStudied_newWordsComeFromTheStarterDeckAtTheLearnersLevel_AC_HT_81() throws Exception {
        UUID user = student();
        String prefix = prefix("c2");
        UUID deck = vocab.deck(prefix, false);
        vocab.fill(deck, 1, 20, prefix);
        jdbc.update("UPDATE vocab_decks SET cefr_level = 'C2' WHERE id = ?", deck);   // không test nào khác dùng C2
        // Cấp độ hiện tại là C2 vì học viên chỉ luyện bài C2 trong 30 ngày gần nhất
        UUID topic = lessonFixtures.topic("Level " + base);
        UUID lesson = lessonFixtures.lesson(topic, "C2 " + base, false, "published", "C2", 1, false);
        attempts.insertAttempt(user, lessonFixtures.sentence(lesson, 0, "Hello there."), "dictation", "normal", false,
                false, java.time.Instant.now().minusSeconds(86_400));

        assertThat(sources(user).get("newWords")).isEqualTo(7);
        List<Map<String, Object>> newWords = items(user).stream().filter(i -> "NEW_WORD".equals(i.get("source"))).toList();
        assertThat(newWords).hasSize(7);
        assertThat(jdbc.queryForList("SELECT DISTINCT deck_id FROM vocab_cards WHERE id IN ("
                + newWords.stream().map(i -> "'" + idOf(i) + "'").collect(Collectors.joining(",")) + ")", UUID.class))
                .containsExactly(deck);
    }

    @Test
    void extraRound_hasOnlyDueCards_andDoesNotUseTheFrame_AC_HT_60() throws Exception {
        UUID user = student();
        List<UUID> due = dueCards(user, 5);
        studiedDeck(user, false, 30, "1 hour");
        weakCards(user, 5);

        String body = as(user, get(CARDS + "?extra=true")).andExpect(status().isOk()).andReturn().getResponse()
                .getContentAsString();
        List<Map<String, Object>> extra = JsonPath.read(body, "$.data.cards");

        assertThat(extra).hasSize(5).allSatisfy(i -> assertThat(i.get("source")).isEqualTo("DUE"));
        assertThat(extra.stream().map(DailyFrameApiIntegrationTest::idOf).collect(Collectors.toSet())).isEqualTo(ids(due));
    }

    @Test
    void daily_cardsEndpointNeedsAToken() throws Exception {
        mockMvc.perform(get(CARDS)).andExpect(status().isUnauthorized());
    }
}
