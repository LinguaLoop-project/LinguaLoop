package com.lingualoop.backend.vocab.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
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

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;
import com.lingualoop.backend.vocab.service.VocabCatalogImporter;

/**
 * Nhập các bộ hệ thống từ từ điển (BR-VOCAB-04) và đọc danh sách bộ, chi tiết bộ (UC-VOCAB-03, UC-VOCAB-04) trên
 * Postgres thật. Cơ sở dữ liệu của test dùng chung nên mỗi test chèn từ riêng với tiền tố riêng và chỉ kiểm tra
 * những thẻ của mình.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class})
class VocabDeckApiIntegrationTest {

    private static final String DECKS = "/api/v1/vocab/decks";

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DictationTestData data;
    @Autowired private VocabCatalogImporter importer;

    /** Mỗi test một tiền tố riêng, chỉ chữ cái và số, xếp sau các từ thật nên các từ của test liền nhau. */
    private final String base = "zz" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user)));
    }

    private UUID insertWord(String headword, String level, String meaningsJson) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO dictionary_words (id, headword, cefr_level, ipa_uk, ipa_us, audio_us, meanings)
                VALUES (?, ?, CAST(? AS cefr_code), '/uk/', '/us/', 'audio/x-us.mp3', CAST(? AS jsonb))""",
                id, headword, level, meaningsJson);
        return id;
    }

    private static String meanings(String translation) {
        return "[{\"no\":1,\"pos\":\"noun\",\"translation_vi\":\"" + translation
                + "\",\"example_en\":\"an example\",\"example_vi\":\"ví dụ\"}]";
    }

    /** Chèn {@code count} từ B2 nối tiếp nhau theo bảng chữ cái rồi nhập bộ. */
    private void importWords(int count, int from) {
        for (int i = from; i < from + count; i++) {
            insertWord(base + String.format("%03d", i), "B2", meanings("nghĩa " + i));
        }
        importer.importCatalog();
    }

    /** Vị trí liên tục của thẻ trong bộ: phần nhân 20 cộng thứ tự trong phần. */
    private List<Map<String, Object>> myCards() {
        return jdbc.queryForList("""
                SELECT c.word, c.pos, c.translation_vi, c.meaning_no, g.sort_order * 20 + c.sort_order AS ordinal,
                       g.id AS group_id, c.id AS card_id
                FROM vocab_cards c JOIN vocab_groups g ON g.id = c.group_id
                JOIN vocab_decks d ON d.id = g.deck_id
                WHERE d.slug = 'oxford-b2' AND c.word LIKE ? ORDER BY c.word""", base + "%");
    }

    // ---------------------------------------------------------------- nhập bộ (BR-VOCAB-04)

    @Test
    void import_buildsAlphabeticalPartsOfTwenty_BR_VOCAB_04() {
        importWords(45, 0);

        List<Map<String, Object>> cards = myCards();
        assertThat(cards).hasSize(45);
        for (int i = 1; i < cards.size(); i++) {
            long previous = ((Number) cards.get(i - 1).get("ordinal")).longValue();
            assertThat(((Number) cards.get(i).get("ordinal")).longValue()).isEqualTo(previous + 1);
        }
        assertThat(jdbc.queryForObject("SELECT count(*) FROM vocab_cards c JOIN vocab_groups g ON g.id = c.group_id "
                + "WHERE c.sort_order >= 20", Integer.class)).isZero();
        assertThat(cards.get(0)).containsEntry("translation_vi", "nghĩa 0").containsEntry("pos", "noun");

        Map<String, Object> deck = jdbc.queryForMap(
                "SELECT is_pro, visibility, kind, status FROM vocab_decks WHERE slug = 'oxford-b2'");
        assertThat(deck).containsEntry("is_pro", true).containsEntry("visibility", "system")
                .containsEntry("kind", "catalog").containsEntry("status", "APPROVED");
        assertThat(jdbc.queryForObject("SELECT is_pro FROM vocab_decks WHERE slug = 'oxford-a1'", Boolean.class)).isFalse();
        assertThat(jdbc.queryForObject("SELECT is_pro FROM vocab_decks WHERE slug = 'oxford-c2'", Boolean.class)).isTrue();
    }

    @Test
    void import_namesEachPartByItsFirstAndLastWord() {
        importWords(30, 0);

        List<String> names = jdbc.queryForList("""
                SELECT g.name_vi FROM vocab_groups g
                WHERE g.id IN (SELECT group_id FROM vocab_cards WHERE word LIKE ?) ORDER BY g.sort_order""",
                String.class, base + "%");
        assertThat(names).isNotEmpty().allSatisfy(name -> assertThat(name).matches("Phần \\d+ · .+ – .+"));
        // một phần chỉ chứa từ của test này thì tên đúng bằng từ đầu và từ cuối của nó
        String own = jdbc.queryForObject("""
                SELECT g.name_vi FROM vocab_groups g JOIN vocab_cards c ON c.group_id = g.id
                WHERE c.word = ?""", String.class, base + "010");
        assertThat(own).contains(" – ").contains(base);
    }

    @Test
    void import_takesTheLowestNumberedMeaning_andSkipsFormsAndWordsWithoutMeaning() {
        insertWord(base + "a", "B2",
                "[{\"no\":3,\"pos\":\"verb\",\"translation_vi\":\"ba\"},{\"no\":2,\"pos\":\"noun\",\"translation_vi\":\"hai\"}]");
        insertWord(base + "empty", "B2", "[]");
        UUID lemma = insertWord(base + "lemma", "B2", meanings("gốc"));
        jdbc.update("INSERT INTO dictionary_words (id, headword, cefr_level, lemma_id, meanings) "
                + "VALUES (?, ?, 'B2'::cefr_code, ?, CAST(? AS jsonb))", UUID.randomUUID(), base + "forms", lemma, meanings("dạng chia"));
        insertWord(base + "other", "C1", meanings("mức khác"));
        importer.importCatalog();

        assertThat(myCards()).extracting(card -> card.get("word")).containsExactly(base + "a", base + "lemma");
        Map<String, Object> a = myCards().get(0);
        assertThat(a).containsEntry("meaning_no", 2).containsEntry("translation_vi", "hai").containsEntry("pos", "noun");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM vocab_cards WHERE word = ?", Integer.class, base + "other")).isEqualTo(1);
    }

    @Test
    void import_copiesPhoneticsOfBothAccents() {
        importWords(1, 0);

        Map<String, Object> card = myCards().get(0);
        List<Map<String, Object>> phonetics = jdbc.queryForList(
                "SELECT accent, ipa, audio_url FROM vocab_card_phonetics WHERE card_id = ? ORDER BY accent", card.get("card_id"));
        assertThat(phonetics).hasSize(2);
        assertThat(phonetics.get(0)).containsEntry("accent", "uk").containsEntry("ipa", "/uk/").containsEntry("audio_url", null);
        assertThat(phonetics.get(1)).containsEntry("accent", "us").containsEntry("ipa", "/us/").containsEntry("audio_url", "audio/x-us.mp3");
    }

    @Test
    void import_runAgain_addsNothing_andNewWordsAreAppendedWithoutMovingOldOnes() {
        importWords(25, 0);
        List<Map<String, Object>> before = myCards();
        int deckCards = jdbc.queryForObject("SELECT count(*) FROM vocab_cards c JOIN vocab_groups g ON g.id = c.group_id "
                + "JOIN vocab_decks d ON d.id = g.deck_id WHERE d.slug = 'oxford-b2'", Integer.class);

        assertThat(importer.importCatalog()).isZero();
        assertThat(myCards()).isEqualTo(before);

        importWords(3, 100);
        List<Map<String, Object>> after = myCards();
        assertThat(after).hasSize(28);
        assertThat(after.subList(0, 25)).isEqualTo(before);
        assertThat(((Number) after.get(25).get("ordinal")).longValue()).isEqualTo(deckCards);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM vocab_cards c JOIN vocab_groups g ON g.id = c.group_id "
                + "JOIN vocab_decks d ON d.id = g.deck_id WHERE d.slug = 'oxford-b2' AND c.word LIKE ?", Integer.class, base + "%"))
                .isEqualTo(28);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM vocab_decks WHERE slug = 'oxford-b2'", Integer.class)).isEqualTo(1);
    }

    // ---------------------------------------------------------------- danh sách bộ (UC-VOCAB-03)

    @Test
    void list_showsSystemDecksWithTheLearnersProgress_AC_VOCAB_11() throws Exception {
        insertWord(base + "a1", "A1", meanings("nghĩa"));
        importWords(10, 0);
        UUID user = data.newUser();
        List<Map<String, Object>> cards = myCards();
        progress(user, (UUID) cards.get(0).get("card_id"), "mastered", Instant.now().plus(25, ChronoUnit.DAYS));
        progress(user, (UUID) cards.get(1).get("card_id"), "learning", Instant.now().minusSeconds(60));
        progress(user, (UUID) cards.get(2).get("card_id"), "reviewing", Instant.now().plus(3, ChronoUnit.DAYS));

        as(user, get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.decks[?(@.slug=='oxford-b2')].pro").value(true))
                .andExpect(jsonPath("$.data.decks[?(@.slug=='oxford-b2')].progress.mastered").value(1))
                .andExpect(jsonPath("$.data.decks[?(@.slug=='oxford-b2')].progress.reviewing").value(1))
                .andExpect(jsonPath("$.data.decks[?(@.slug=='oxford-b2')].progress.learning").value(1))
                .andExpect(jsonPath("$.data.decks[?(@.slug=='oxford-b2')].dueCount").value(1))
                .andExpect(jsonPath("$.data.decks[?(@.slug=='oxford-a1')].progress.mastered").value(0))
                .andExpect(jsonPath("$.data.decks[?(@.slug=='oxford-a1')].pro").value(false));
    }

    @Test
    void list_overviewCountsEveryCardIncludingSavedWords_AC_VOCAB_10() throws Exception {
        importWords(5, 0);
        UUID user = data.newUser();
        List<Map<String, Object>> cards = myCards();
        progress(user, (UUID) cards.get(0).get("card_id"), "mastered", Instant.now().minus(1, ChronoUnit.DAYS));
        progress(user, (UUID) cards.get(1).get("card_id"), "learning", Instant.now().minusSeconds(60));
        progress(user, (UUID) cards.get(2).get("card_id"), "learning", Instant.now().plus(1, ChronoUnit.DAYS));
        insertWord(base + "saved", null, meanings("đã lưu"));
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
    void list_savedWordsDeckIsNotAListedDeck_AC_VOCAB_10() throws Exception {
        importWords(1, 0);
        UUID user = data.newUser();
        insertWord(base + "saved", null, meanings("đã lưu"));
        as(user, put("/api/v1/vocab/saved-words").contentType(MediaType.APPLICATION_JSON)
                .content("{\"headword\":\"" + base + "saved\",\"meaningNo\":1}")).andExpect(status().isOk());

        as(user, get(DECKS)).andExpect(jsonPath("$.data.decks[?(@.slug=='oxford-b2')]").isNotEmpty())
                .andExpect(jsonPath("$.data.decks[?(@.slug==null)]").isEmpty())
                .andExpect(jsonPath("$.data.decks[?(@.nameVi=='Từ đã lưu')]").isEmpty());
        as(user, get(DECKS + "/saved")).andExpect(status().isNotFound());
    }

    @Test
    void list_isEmptyOfProgressForANewLearner() throws Exception {
        insertWord(base + "a1", "A1", meanings("nghĩa"));
        importWords(1, 0);

        as(data.newUser(), get(DECKS)).andExpect(jsonPath("$.data.overview.due").value(0))
                .andExpect(jsonPath("$.data.overview.mastered").value(0))
                .andExpect(jsonPath("$.data.decks[?(@.slug=='oxford-a1')].progress.newCount").isNotEmpty());
    }

    // ---------------------------------------------------------------- chi tiết bộ (UC-VOCAB-04)

    @Test
    void detail_lockPartsOfAProDeckFromTheThirdForAFreeUser_AC_VOCAB_12() throws Exception {
        importWords(50, 0);

        as(data.newUser(), get(DECKS + "/oxford-b2")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deck.slug").value("oxford-b2"))
                .andExpect(jsonPath("$.data.deck.pro").value(true))
                .andExpect(jsonPath("$.data.parts[0].locked").value(false))
                .andExpect(jsonPath("$.data.parts[1].locked").value(false))
                .andExpect(jsonPath("$.data.parts[2].locked").value(true))
                .andExpect(jsonPath("$.data.parts[2].index").value(2))
                .andExpect(jsonPath("$.data.sampleWords.length()").value(8))
                .andExpect(jsonPath("$.data.sampleWords[0].word").isNotEmpty());
    }

    @Test
    void detail_nothingIsLockedForAProUser_AC_VOCAB_13() throws Exception {
        importWords(50, 0);

        as(data.newProUser(), get(DECKS + "/oxford-b2")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.parts[?(@.locked==true)]").isEmpty());
    }

    @Test
    void detail_aFreeDeckIsNeverLocked() throws Exception {
        for (int i = 0; i < 50; i++) {
            insertWord(base + String.format("%03d", i), "A1", meanings("nghĩa"));
        }
        importer.importCatalog();

        as(data.newUser(), get(DECKS + "/oxford-a1")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deck.pro").value(false))
                .andExpect(jsonPath("$.data.parts[?(@.locked==true)]").isEmpty());
    }

    @Test
    void detail_reportsTheLearnersProgressPerPart() throws Exception {
        importWords(10, 0);
        UUID user = data.newUser();
        List<Map<String, Object>> cards = myCards();
        UUID group = (UUID) cards.get(0).get("group_id");
        progress(user, (UUID) cards.get(0).get("card_id"), "learning", Instant.now().plusSeconds(600));
        progress(user, (UUID) cards.get(1).get("card_id"), "new", Instant.now());

        int index = jdbc.queryForObject("SELECT sort_order FROM vocab_groups WHERE id = ?", Integer.class, group);
        as(user, get(DECKS + "/oxford-b2")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.parts[?(@.index==" + index + ")].studiedCount").value(1))
                .andExpect(jsonPath("$.data.deck.progress.learning").value(1));
    }

    @Test
    void detail_unknownOrHiddenDeck_is404() throws Exception {
        importWords(1, 0);
        UUID user = data.newUser();
        as(user, get(DECKS + "/no-such-deck")).andExpect(status().isNotFound());

        jdbc.update("UPDATE vocab_decks SET deleted_at = now() WHERE slug = 'oxford-c1'");
        try {
            as(user, get(DECKS + "/oxford-c1")).andExpect(status().isNotFound());
        } finally {
            jdbc.update("UPDATE vocab_decks SET deleted_at = NULL WHERE slug = 'oxford-c1'");
        }
    }

    @Test
    void endpoints_requireLogin() throws Exception {
        mockMvc.perform(get(DECKS)).andExpect(status().isUnauthorized());
        mockMvc.perform(get(DECKS + "/oxford-a1")).andExpect(status().isUnauthorized());
    }

    private void progress(UUID user, UUID card, String status, Instant nextReview) {
        jdbc.update("""
                INSERT INTO user_card_progress (user_id, card_id, status, repetitions, interval_days, next_review_at)
                VALUES (?, ?, ?, 1, 1, ?)""", user, card, status, Timestamp.from(nextReview));
    }
}
