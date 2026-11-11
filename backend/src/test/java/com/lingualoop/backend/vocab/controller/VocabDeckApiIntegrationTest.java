package com.lingualoop.backend.vocab.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
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

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;
import com.lingualoop.backend.vocab.VocabTestData;

/**
 * Danh sách bộ và chi tiết bộ (UC-HT-01) trên Postgres thật. Bộ từ vựng là dữ liệu riêng nạp từ
 * seed, không sinh từ từ điển, nên test tự chèn bộ, phần và thẻ. Cơ sở dữ liệu của test dùng chung nên mỗi test dùng
 * bộ riêng với tiền tố ngẫu nhiên và chỉ kiểm tra những bộ của mình.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class})
class VocabDeckApiIntegrationTest {

    private static final String DECKS = "/api/v1/vocab/decks";

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DictationTestData data;

    /** Mỗi test một tiền tố riêng, chỉ chữ cái và số. */
    private final String base = "zz" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user)));
    }

    private void insertWord(String headword, String meaningsJson) {
        jdbc.update("""
                INSERT INTO dictionary_words (id, headword, ipa_uk, ipa_us, audio_us, meanings)
                VALUES (?, ?, '/uk/', '/us/', 'audio/x-us.mp3', CAST(? AS jsonb))""",
                UUID.randomUUID(), headword, meaningsJson);
    }

    private static String meanings(String translation) {
        return "[{\"no\":1,\"pos\":\"noun\",\"meaning_vi\":\"" + translation
                + "\",\"example_en\":\"an example\",\"example_vi\":\"ví dụ\"}]";
    }

    private UUID deckId(String suffix) {
        return VocabTestData.idOf(base + "-" + suffix);
    }

    private String deckPath(String suffix) {
        return DECKS + "/" + deckId(suffix);
    }

    /** Điều kiện chọn bộ của test trong mảng {@code decks}. */
    private String deck(String suffix) {
        return "$.data.decks[?(@.id=='" + deckId(suffix) + "')]";
    }

    /** Tên danh mục là duy nhất trong cả cơ sở dữ liệu nên gắn tiền tố của test. */
    private UUID insertCategory(String suffix) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO deck_categories (id, name) VALUES (?, ?)", id, "Category " + suffix + " " + base);
        return id;
    }

    private UUID insertDeck(String suffix, boolean pro, UUID category) {
        UUID id = deckId(suffix);
        jdbc.update("""
                INSERT INTO vocab_decks (id, owner_id, kind, category_id, name, is_pro, image_url, status)
                VALUES (?, NULL, 'library', ?, ?, ?, ?, 'published')""",
                id, category, "Deck " + suffix + " " + base, pro,
                suffix.equals("a") ? "https://cdn.example.com/" + suffix + ".webp" : null);
        return id;
    }

    /** Thứ tự phần theo {@code created_at} nên ghi mốc tăng dần theo {@code order}. */
    private UUID insertGroup(UUID deck, int order, String name) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO vocab_groups (id, deck_id, name, created_at)
                VALUES (?, ?, ?, now() - interval '1 day' + make_interval(secs => ?))""", id, deck, name, order);
        return id;
    }

    private UUID insertCard(UUID group, int order, String word, String audio) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO vocab_cards (id, deck_id, group_id, word, pos, meaning_vi, example_en, example_vi,
                                         ipa_uk, ipa_us, audio_us_url, created_at)
                VALUES (?, (SELECT deck_id FROM vocab_groups WHERE id = ?), ?, ?, 'noun', ?, 'an example', 'ví dụ',
                        '/uk/', '/us/', ?, now() - interval '1 day' + make_interval(secs => ?))""",
                id, group, group, word, "nghĩa " + word, audio, order);
        return id;
    }

    /** Một bộ có {@code groups} phần, mỗi phần {@code perGroup} thẻ; trả về thẻ theo thứ tự. */
    private List<UUID> fillDeck(UUID deck, int groups, int perGroup) {
        List<UUID> cards = new ArrayList<>();
        for (int g = 1; g <= groups; g++) {
            UUID group = insertGroup(deck, g, "Topic " + g);
            for (int c = 1; c <= perGroup; c++) {
                cards.add(insertCard(group, c, base + "w" + g + "x" + c, "https://cdn.example.com/a" + g + c + ".mp3"));
            }
        }
        return cards;
    }

    /** Tiến độ ở trạng thái {@code status}; trạng thái suy từ số lần nhớ và khoảng ôn (V1). */
    private void progress(UUID user, UUID card, String status, Instant due) {
        int repetitions = status.equals("learning") ? 1 : 3;
        int interval = switch (status) {
            case "mastered" -> 25;
            case "reviewing" -> 6;
            default -> 1;
        };
        jdbc.update("""
                INSERT INTO user_card_progress (user_id, card_id, repetitions, interval_days, due_at)
                VALUES (?, ?, ?, ?, ?)""", user, card, repetitions, interval, Timestamp.from(due));
    }

    // ---------------------------------------------------------------- danh sách bộ (UC-HT-01)

    @Test
    void list_showsSystemDecksWithTheLearnersProgress_AC_HT_02() throws Exception {
        UUID category = insertCategory("c");
        List<UUID> cards = fillDeck(insertDeck("pro", true, category), 2, 5);
        fillDeck(insertDeck("free", false, category), 1, 3);
        UUID user = data.newUser();
        progress(user, cards.get(0), "mastered", Instant.now().plus(25, ChronoUnit.DAYS));
        progress(user, cards.get(1), "learning", Instant.now().minusSeconds(60));
        progress(user, cards.get(2), "reviewing", Instant.now().plus(3, ChronoUnit.DAYS));

        // bộ Pro bị khoá với gói Free: vẫn hiện kèm nhãn Pro và tiến độ cũ, nhưng thẻ đến hạn không tính (BR-HT-13)
        as(user, get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath(deck("pro") + ".pro").value(true))
                .andExpect(jsonPath(deck("pro") + ".cardCount").value(10))
                .andExpect(jsonPath(deck("pro") + ".groupCount").value(2))
                .andExpect(jsonPath(deck("pro") + ".progress.mastered").value(1))
                .andExpect(jsonPath(deck("pro") + ".progress.reviewing").value(1))
                .andExpect(jsonPath(deck("pro") + ".progress.learning").value(1))
                .andExpect(jsonPath(deck("pro") + ".progress.newCount").value(7))
                .andExpect(jsonPath(deck("pro") + ".dueCount").value(0))
                .andExpect(jsonPath(deck("free") + ".progress.mastered").value(0))
                .andExpect(jsonPath(deck("free") + ".pro").value(false));
    }

    @Test
    void list_carriesTheCategoryOfEachDeck() throws Exception {
        fillDeck(insertDeck("a", false, insertCategory("oxf")), 1, 1);

        as(data.newUser(), get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath(deck("a") + ".category.id").isNotEmpty())
                .andExpect(jsonPath(deck("a") + ".category.name").value("Category oxf " + base))
                .andExpect(jsonPath(deck("a") + ".thumbnailUrl").value("https://cdn.example.com/a.webp"));
    }

    @Test
    void list_overviewCountsEveryCardIncludingSavedWords_AC_HT_01() throws Exception {
        List<UUID> cards = fillDeck(insertDeck("ov", false, insertCategory("c")), 1, 5);
        UUID user = data.newUser();
        progress(user, cards.get(0), "mastered", Instant.now().minus(1, ChronoUnit.DAYS));
        progress(user, cards.get(1), "learning", Instant.now().minusSeconds(60));
        progress(user, cards.get(2), "learning", Instant.now().plus(1, ChronoUnit.DAYS));
        insertWord(base + "saved", meanings("đã lưu"));
        as(user, put("/api/v1/vocab/saved-words").contentType(MediaType.APPLICATION_JSON)
                .content("{\"headword\":\"" + base + "saved\",\"meaningNo\":1}")).andExpect(status().isOk());

        // đến hạn: thẻ Đã thuộc quá hạn, thẻ Đang học quá hạn, và thẻ Mới của từ đã lưu; thẻ hẹn ngày mai thì chưa
        as(user, get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.overview.due").value(3))
                .andExpect(jsonPath("$.data.overview.learning").value(2))
                .andExpect(jsonPath("$.data.overview.mastered").value(1))
                .andExpect(jsonPath("$.data.overview.reviewing").value(0));
    }

    @Test
    void list_savedWordsDeckIsNotAListedDeck_AC_HT_01() throws Exception {
        fillDeck(insertDeck("sv", false, insertCategory("c")), 1, 1);
        UUID user = data.newUser();
        insertWord(base + "saved", meanings("đã lưu"));
        as(user, put("/api/v1/vocab/saved-words").contentType(MediaType.APPLICATION_JSON)
                .content("{\"headword\":\"" + base + "saved\",\"meaningNo\":1}")).andExpect(status().isOk());

        UUID saved = jdbc.queryForObject("SELECT id FROM vocab_decks WHERE owner_id = ? AND kind = 'saved'",
                UUID.class, user);
        as(user, get(DECKS)).andExpect(jsonPath(deck("sv")).isNotEmpty())
                .andExpect(jsonPath("$.data.decks[?(@.id=='" + saved + "')]").isEmpty());
        as(user, get(DECKS + "/" + saved)).andExpect(status().isNotFound());
    }

    @Test
    void list_isEmptyOfProgressForANewLearner() throws Exception {
        fillDeck(insertDeck("nw", false, insertCategory("c")), 1, 4);

        as(data.newUser(), get(DECKS)).andExpect(jsonPath("$.data.overview.due").value(0))
                .andExpect(jsonPath("$.data.overview.mastered").value(0))
                .andExpect(jsonPath(deck("nw") + ".progress.newCount").value(4));
    }

    @Test
    void list_skipsDecksWithoutCards_andNonSystemDecks() throws Exception {
        insertDeck("empty", false, insertCategory("c"));
        UUID owner = data.newUser();
        UUID mine = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO vocab_decks (id, owner_id, kind, name)
                VALUES (?, ?, 'personal', 'Của tôi')""", mine, owner);
        insertCard(insertGroup(mine, 1, "G"), 1, base + "mine", null);

        as(owner, get(DECKS)).andExpect(jsonPath(deck("empty")).isEmpty())
                .andExpect(jsonPath("$.data.decks[?(@.id=='" + mine + "')]").isEmpty());
    }

    @Test
    void list_dueCountsLeaveOutCardsOfAProDeck_forAFreeUser_BR_HT_13() throws Exception {
        UUID category = insertCategory("c");
        List<UUID> pro = fillDeck(insertDeck("lk", true, category), 3, 2);
        List<UUID> free = fillDeck(insertDeck("fr2", false, category), 1, 1);
        UUID freeUser = data.newUser();
        UUID proUser = data.newProUser();
        for (UUID user : new UUID[] {freeUser, proUser}) {
            progress(user, pro.get(0), "learning", Instant.now().minusSeconds(60));
            progress(user, pro.get(4), "learning", Instant.now().minusSeconds(60));
            progress(user, free.get(0), "learning", Instant.now().minusSeconds(60));
        }

        // gói Free không có quyền học bộ Pro nên chỉ tính thẻ của bộ miễn phí; gói Pro tính cả hai
        as(freeUser, get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath(deck("lk") + ".dueCount").value(0))
                .andExpect(jsonPath(deck("fr2") + ".dueCount").value(1))
                .andExpect(jsonPath("$.data.overview.due").value(1));
        as(proUser, get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath(deck("lk") + ".dueCount").value(2))
                .andExpect(jsonPath("$.data.overview.due").value(3));
    }

    // ---------------------------------------------------------------- chi tiết bộ (UC-HT-01)

    @Test
    void detail_lockEveryPartOfAProDeckForAFreeUser_AC_HT_03() throws Exception {
        fillDeck(insertDeck("p", true, insertCategory("c")), 4, 10);

        as(data.newUser(), get(deckPath("p"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deck.id").value(deckId("p").toString()))
                .andExpect(jsonPath("$.data.deck.pro").value(true))
                .andExpect(jsonPath("$.data.parts.length()").value(4))
                .andExpect(jsonPath("$.data.parts[0].locked").value(true))
                .andExpect(jsonPath("$.data.parts[1].locked").value(true))
                .andExpect(jsonPath("$.data.parts[2].locked").value(true))
                .andExpect(jsonPath("$.data.parts[2].index").value(2))
                .andExpect(jsonPath("$.data.sampleWords.length()").value(8))
                .andExpect(jsonPath("$.data.sampleWords[0].word").isNotEmpty());
    }

    @Test
    void detail_partsAreNumberedFromZero() throws Exception {
        fillDeck(insertDeck("idx", false, insertCategory("c")), 3, 2);

        as(data.newUser(), get(deckPath("idx"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.parts[0].index").value(0))
                .andExpect(jsonPath("$.data.parts[0].name").value("Topic 1"))
                .andExpect(jsonPath("$.data.parts[0].cardCount").value(2))
                .andExpect(jsonPath("$.data.parts[2].index").value(2));
    }

    @Test
    void detail_nothingIsLockedForAProUser_AC_HT_04() throws Exception {
        fillDeck(insertDeck("pu", true, insertCategory("c")), 4, 5);

        as(data.newProUser(), get(deckPath("pu"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.parts[?(@.locked==true)]").isEmpty());
    }

    @Test
    void detail_aFreeDeckIsNeverLocked() throws Exception {
        fillDeck(insertDeck("fr", false, insertCategory("c")), 5, 3);

        as(data.newUser(), get(deckPath("fr"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deck.pro").value(false))
                .andExpect(jsonPath("$.data.parts[?(@.locked==true)]").isEmpty());
    }

    @Test
    void detail_reportsTheLearnersProgressPerPart() throws Exception {
        List<UUID> cards = fillDeck(insertDeck("pg", false, insertCategory("c")), 2, 5);
        UUID user = data.newUser();
        progress(user, cards.get(5), "learning", Instant.now().plusSeconds(600));

        as(user, get(deckPath("pg"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.parts[0].studiedCount").value(0))
                .andExpect(jsonPath("$.data.parts[1].studiedCount").value(1))
                .andExpect(jsonPath("$.data.deck.progress.learning").value(1));
    }

    @Test
    void detail_sampleWordsKeepFullAudioUrlsAndBothIpa() throws Exception {
        fillDeck(insertDeck("au", false, insertCategory("c")), 1, 2);

        as(data.newUser(), get(deckPath("au"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sampleWords[0].audioUs").value("https://cdn.example.com/a11.mp3"))
                .andExpect(jsonPath("$.data.sampleWords[0].ipaUk").value("/uk/"))
                .andExpect(jsonPath("$.data.sampleWords[0].ipaUs").value("/us/"))
                .andExpect(jsonPath("$.data.sampleWords[0].meaningVi").value("nghĩa " + base + "w1x1"));
    }

    @Test
    void detail_unknownOrHiddenDeck_is404() throws Exception {
        UUID deck = insertDeck("hid", false, insertCategory("c"));
        fillDeck(deck, 1, 1);
        UUID user = data.newUser();
        as(user, get(DECKS + "/" + UUID.randomUUID())).andExpect(status().isNotFound());

        jdbc.update("UPDATE vocab_decks SET deleted_at = now() WHERE id = ?", deck);
        as(user, get(deckPath("hid"))).andExpect(status().isNotFound());
    }

    @Test
    void endpoints_requireLogin() throws Exception {
        mockMvc.perform(get(DECKS)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(DECKS + "/" + UUID.randomUUID())).andExpect(status().isUnauthorized());
    }
}
