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

/**
 * Danh sách bộ và chi tiết bộ (UC-HT-01) trên Postgres thật. Bộ từ vựng là dữ liệu riêng nạp từ
 * seed, không sinh từ từ điển, nên test tự chèn bộ, phần và thẻ. Cơ sở dữ liệu của test dùng chung nên mỗi test dùng
 * slug riêng với tiền tố ngẫu nhiên và chỉ kiểm tra những bộ của mình.
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
        return "[{\"no\":1,\"pos\":\"noun\",\"translation_vi\":\"" + translation
                + "\",\"example_en\":\"an example\",\"example_vi\":\"ví dụ\"}]";
    }

    private String slug(String suffix) {
        return base + "-" + suffix;
    }

    private String deckPath(String suffix) {
        return DECKS + "/" + slug(suffix);
    }

    /** Điều kiện chọn bộ của test trong mảng {@code decks}. */
    private String deck(String suffix) {
        return "$.data.decks[?(@.slug=='" + slug(suffix) + "')]";
    }

    private UUID insertCategory(String suffix, int order) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO vocab_deck_categories (id, slug, name_en, name_vi, sort_order) VALUES (?, ?, ?, ?, ?)",
                id, slug(suffix + "-cat"), "Category " + suffix, "Danh mục " + suffix, order);
        return id;
    }

    private UUID insertDeck(String suffix, boolean pro, UUID category) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO vocab_decks (id, owner_id, category_id, slug, name, name_vi, difficulty, is_pro,
                                         thumbnail_url, visibility, status, sort_order)
                VALUES (?, NULL, ?, ?, ?, ?, CAST('B1' AS cefr_code), ?, ?, 'system', 'APPROVED', 1)""",
                id, category, slug(suffix), "Deck " + suffix, "Bộ " + suffix, pro,
                suffix.equals("a") ? "https://cdn.example.com/" + suffix + ".webp" : null);
        return id;
    }

    /** Phần đánh số từ 1 như seed (không phải từ 0). */
    private UUID insertGroup(UUID deck, int sortOrder, String name) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO vocab_groups (id, deck_id, name, name_vi, sort_order) VALUES (?, ?, ?, ?, ?)",
                id, deck, name, "Chủ đề " + name, sortOrder);
        return id;
    }

    private UUID insertCard(UUID group, int sortOrder, String word, String audio) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO vocab_cards (id, group_id, word, pos, translation_vi, example_en, example_vi, sort_order)
                VALUES (?, ?, ?, 'noun', ?, 'an example', 'ví dụ', ?)""", id, group, word, "nghĩa " + word, sortOrder);
        jdbc.update("INSERT INTO vocab_card_phonetics (card_id, accent, ipa, audio_url) VALUES (?, 'uk', '/uk/', NULL)", id);
        jdbc.update("INSERT INTO vocab_card_phonetics (card_id, accent, ipa, audio_url) VALUES (?, 'us', '/us/', ?)", id, audio);
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

    private void progress(UUID user, UUID card, String status, Instant nextReview) {
        jdbc.update("""
                INSERT INTO user_card_progress (user_id, card_id, status, repetitions, interval_days, next_review_at)
                VALUES (?, ?, ?, 1, 1, ?)""", user, card, status, Timestamp.from(nextReview));
    }

    // ---------------------------------------------------------------- danh sách bộ (UC-HT-01)

    @Test
    void list_showsSystemDecksWithTheLearnersProgress_AC_HT_02() throws Exception {
        UUID category = insertCategory("c", 90);
        List<UUID> cards = fillDeck(insertDeck("pro", true, category), 2, 5);
        fillDeck(insertDeck("free", false, category), 1, 3);
        UUID user = data.newUser();
        progress(user, cards.get(0), "mastered", Instant.now().plus(25, ChronoUnit.DAYS));
        progress(user, cards.get(1), "learning", Instant.now().minusSeconds(60));
        progress(user, cards.get(2), "reviewing", Instant.now().plus(3, ChronoUnit.DAYS));

        as(user, get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath(deck("pro") + ".pro").value(true))
                .andExpect(jsonPath(deck("pro") + ".cardCount").value(10))
                .andExpect(jsonPath(deck("pro") + ".groupCount").value(2))
                .andExpect(jsonPath(deck("pro") + ".progress.mastered").value(1))
                .andExpect(jsonPath(deck("pro") + ".progress.reviewing").value(1))
                .andExpect(jsonPath(deck("pro") + ".progress.learning").value(1))
                .andExpect(jsonPath(deck("pro") + ".progress.newCount").value(7))
                .andExpect(jsonPath(deck("pro") + ".dueCount").value(1))
                .andExpect(jsonPath(deck("free") + ".progress.mastered").value(0))
                .andExpect(jsonPath(deck("free") + ".pro").value(false));
    }

    @Test
    void list_carriesTheCategoryOfEachDeck() throws Exception {
        fillDeck(insertDeck("a", false, insertCategory("oxf", 91)), 1, 1);

        as(data.newUser(), get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath(deck("a") + ".category.slug").value(slug("oxf-cat")))
                .andExpect(jsonPath(deck("a") + ".category.name").value("Category oxf"))
                .andExpect(jsonPath(deck("a") + ".category.nameVi").value("Danh mục oxf"))
                .andExpect(jsonPath(deck("a") + ".thumbnailUrl").value("https://cdn.example.com/a.webp"));
    }

    @Test
    void list_overviewCountsEveryCardIncludingSavedWords_AC_HT_01() throws Exception {
        List<UUID> cards = fillDeck(insertDeck("ov", false, insertCategory("c", 92)), 1, 5);
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
        fillDeck(insertDeck("sv", false, insertCategory("c", 93)), 1, 1);
        UUID user = data.newUser();
        insertWord(base + "saved", meanings("đã lưu"));
        as(user, put("/api/v1/vocab/saved-words").contentType(MediaType.APPLICATION_JSON)
                .content("{\"headword\":\"" + base + "saved\",\"meaningNo\":1}")).andExpect(status().isOk());

        as(user, get(DECKS)).andExpect(jsonPath(deck("sv")).isNotEmpty())
                .andExpect(jsonPath("$.data.decks[?(@.slug==null)]").isEmpty())
                .andExpect(jsonPath("$.data.decks[?(@.nameVi=='Từ đã lưu')]").isEmpty());
        as(user, get(DECKS + "/saved")).andExpect(status().isNotFound());
    }

    @Test
    void list_isEmptyOfProgressForANewLearner() throws Exception {
        fillDeck(insertDeck("nw", false, insertCategory("c", 94)), 1, 4);

        as(data.newUser(), get(DECKS)).andExpect(jsonPath("$.data.overview.due").value(0))
                .andExpect(jsonPath("$.data.overview.mastered").value(0))
                .andExpect(jsonPath(deck("nw") + ".progress.newCount").value(4));
    }

    @Test
    void list_skipsDecksWithoutCards_andNonSystemDecks() throws Exception {
        insertDeck("empty", false, insertCategory("c", 95));
        UUID owner = data.newUser();
        UUID mine = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO vocab_decks (id, owner_id, slug, name, visibility, status)
                VALUES (?, ?, ?, 'Của tôi', 'private', 'APPROVED')""", mine, owner, slug("mine"));
        insertCard(insertGroup(mine, 1, "G"), 1, base + "mine", null);

        as(owner, get(DECKS)).andExpect(jsonPath(deck("empty")).isEmpty())
                .andExpect(jsonPath(deck("mine")).isEmpty());
    }

    // ---------------------------------------------------------------- chi tiết bộ (UC-HT-01)

    @Test
    void detail_lockPartsOfAProDeckFromTheThirdForAFreeUser_AC_HT_03() throws Exception {
        fillDeck(insertDeck("p", true, insertCategory("c", 96)), 4, 10);

        as(data.newUser(), get(deckPath("p"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deck.slug").value(slug("p")))
                .andExpect(jsonPath("$.data.deck.pro").value(true))
                .andExpect(jsonPath("$.data.parts.length()").value(4))
                .andExpect(jsonPath("$.data.parts[0].locked").value(false))
                .andExpect(jsonPath("$.data.parts[1].locked").value(false))
                .andExpect(jsonPath("$.data.parts[2].locked").value(true))
                .andExpect(jsonPath("$.data.parts[2].index").value(2))
                .andExpect(jsonPath("$.data.sampleWords.length()").value(8))
                .andExpect(jsonPath("$.data.sampleWords[0].word").isNotEmpty());
    }

    @Test
    void detail_partsAreNumberedFromZeroEvenThoughSeedGroupsStartAtOne() throws Exception {
        fillDeck(insertDeck("idx", false, insertCategory("c", 97)), 3, 2);

        as(data.newUser(), get(deckPath("idx"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.parts[0].index").value(0))
                .andExpect(jsonPath("$.data.parts[0].name").value("Topic 1"))
                .andExpect(jsonPath("$.data.parts[0].nameVi").value("Chủ đề Topic 1"))
                .andExpect(jsonPath("$.data.parts[0].cardCount").value(2))
                .andExpect(jsonPath("$.data.parts[2].index").value(2));
    }

    @Test
    void detail_nothingIsLockedForAProUser_AC_HT_04() throws Exception {
        fillDeck(insertDeck("pu", true, insertCategory("c", 98)), 4, 5);

        as(data.newProUser(), get(deckPath("pu"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.parts[?(@.locked==true)]").isEmpty());
    }

    @Test
    void detail_aFreeDeckIsNeverLocked() throws Exception {
        fillDeck(insertDeck("fr", false, insertCategory("c", 99)), 5, 3);

        as(data.newUser(), get(deckPath("fr"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deck.pro").value(false))
                .andExpect(jsonPath("$.data.parts[?(@.locked==true)]").isEmpty());
    }

    @Test
    void detail_reportsTheLearnersProgressPerPart() throws Exception {
        List<UUID> cards = fillDeck(insertDeck("pg", false, insertCategory("c", 100)), 2, 5);
        UUID user = data.newUser();
        progress(user, cards.get(5), "learning", Instant.now().plusSeconds(600));
        progress(user, cards.get(6), "new", Instant.now());

        as(user, get(deckPath("pg"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.parts[0].studiedCount").value(0))
                .andExpect(jsonPath("$.data.parts[1].studiedCount").value(1))
                .andExpect(jsonPath("$.data.deck.progress.learning").value(1));
    }

    @Test
    void detail_sampleWordsKeepFullAudioUrlsAndBothIpa() throws Exception {
        fillDeck(insertDeck("au", false, insertCategory("c", 101)), 1, 2);

        as(data.newUser(), get(deckPath("au"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.sampleWords[0].audioUs").value("https://cdn.example.com/a11.mp3"))
                .andExpect(jsonPath("$.data.sampleWords[0].ipaUk").value("/uk/"))
                .andExpect(jsonPath("$.data.sampleWords[0].ipaUs").value("/us/"))
                .andExpect(jsonPath("$.data.sampleWords[0].translationVi").value("nghĩa " + base + "w1x1"));
    }

    @Test
    void detail_unknownOrHiddenDeck_is404() throws Exception {
        UUID deck = insertDeck("hid", false, insertCategory("c", 102));
        fillDeck(deck, 1, 1);
        UUID user = data.newUser();
        as(user, get(DECKS + "/no-such-deck")).andExpect(status().isNotFound());

        jdbc.update("UPDATE vocab_decks SET deleted_at = now() WHERE id = ?", deck);
        as(user, get(deckPath("hid"))).andExpect(status().isNotFound());
    }

    @Test
    void endpoints_requireLogin() throws Exception {
        mockMvc.perform(get(DECKS)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(DECKS + "/anything")).andExpect(status().isUnauthorized());
    }
}
