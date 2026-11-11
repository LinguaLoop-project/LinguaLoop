package com.lingualoop.backend.vocab.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

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

/** Lưu và bỏ lưu từ, danh sách từ đã lưu (UC-HT-06, UC-HT-07) chạy trên Postgres thật. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class})
class SavedWordApiIntegrationTest {

    private static final String SAVED = "/api/v1/vocab/saved-words";

    private static final String PRESENT = """
            [{"no":1,"pos":"adjective","meaning_vi":"có mặt, hiện diện","example_en":"to be present at","example_vi":"có mặt ở"},
             {"no":2,"pos":"noun","meaning_vi":"quà biếu","example_en":null,"example_vi":null}]""";

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DictationTestData data;

    /** Mỗi test một tiền tố riêng (chỉ chữ cái và số) để từ không đụng dữ liệu của test khác. */
    private final String base = "zv" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user)));
    }

    private ResultActions save(UUID user, String headword, int meaningNo, UUID sentenceId) throws Exception {
        String sentence = sentenceId == null ? "" : ",\"sentenceId\":\"" + sentenceId + "\"";
        return as(user, put(SAVED).contentType(MediaType.APPLICATION_JSON)
                .content("{\"headword\":\"" + headword + "\",\"meaningNo\":" + meaningNo + sentence + "}"));
    }

    private UUID insertWord(String headword, String meaningsJson) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO dictionary_words (id, headword, ipa_uk, ipa_us, audio_us, meanings)
                VALUES (?, ?, '/ˈpreznt/', '/ˈprezənt/', 'audio/present-us.mp3', CAST(? AS jsonb))""",
                id, headword, meaningsJson);
        return id;
    }

    /** Thẻ đang hiện trong bộ "Từ đã lưu" của học viên. */
    private static final String SAVED_CARDS = "SELECT count(*) FROM vocab_cards c JOIN vocab_decks d ON d.id = c.deck_id "
            + "WHERE d.owner_id = ? AND d.kind = 'saved' AND c.deleted_at IS NULL";

    private int count(String sql, Object... args) {
        Integer n = jdbc.queryForObject(sql, Integer.class, args);
        return n == null ? 0 : n;
    }

    // ---------------------------------------------------------------- UC-HT-06: lưu

    @Test
    void save_createsACardFromTheDictionaryMeaning_AC_HT_42() throws Exception {
        UUID user = data.newUser();
        insertWord(base, PRESENT);

        save(user, base, 1, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.headword").value(base))
                .andExpect(jsonPath("$.data.pos").value("adjective"))
                .andExpect(jsonPath("$.data.meaningNo").value(1))
                .andExpect(jsonPath("$.data.meaningVi").value("có mặt, hiện diện"))
                .andExpect(jsonPath("$.data.exampleEn").value("to be present at"))
                .andExpect(jsonPath("$.data.ipaUs").value("/ˈprezənt/"))
                .andExpect(jsonPath("$.data.ipaUk").value("/ˈpreznt/"))
                .andExpect(jsonPath("$.data.audioUs").value("audio/present-us.mp3"))
                .andExpect(jsonPath("$.data.source").value("dictionary"))
                .andExpect(jsonPath("$.data.lesson").doesNotExist())
                .andExpect(jsonPath("$.data.status").value("new"))
                .andExpect(jsonPath("$.data.due").value(true));

        as(user, get(SAVED)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].headword").value(base));
    }

    @Test
    void save_twice_keepsOneCard_AC_HT_43() throws Exception {
        UUID user = data.newUser();
        insertWord(base, PRESENT);

        save(user, base, 1, null).andExpect(status().isOk());
        save(user, base, 1, null).andExpect(status().isOk());

        as(user, get(SAVED)).andExpect(jsonPath("$.data.length()").value(1));
        assertThat(count(SAVED_CARDS, user)).isEqualTo(1);
    }

    @Test
    void save_atTheSameTime_keepsOneCard_AC_HT_43() throws Exception {
        UUID user = data.newUser();
        insertWord(base, PRESENT);

        ExecutorService pool = Executors.newFixedThreadPool(4);
        try {
            List<Callable<Integer>> calls = java.util.stream.IntStream.range(0, 4)
                    .<Callable<Integer>>mapToObj(i -> () -> save(user, base, 1, null).andReturn().getResponse().getStatus())
                    .toList();
            for (Future<Integer> result : pool.invokeAll(calls)) {
                assertThat(result.get()).isEqualTo(200);
            }
        } finally {
            pool.shutdownNow();
        }

        as(user, get(SAVED)).andExpect(jsonPath("$.data.length()").value(1));
        assertThat(count("SELECT count(*) FROM vocab_decks WHERE owner_id = ? AND kind = 'saved'", user)).isEqualTo(1);
    }

    @Test
    void save_twoMeaningsOfOneWord_makesTwoCards_AC_HT_44() throws Exception {
        UUID user = data.newUser();
        insertWord(base, PRESENT);

        save(user, base, 1, null).andExpect(status().isOk());
        save(user, base, 2, null).andExpect(status().isOk());

        as(user, get(SAVED)).andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].meaningNo").value(2))
                .andExpect(jsonPath("$.data[0].meaningVi").value("quà biếu"))
                .andExpect(jsonPath("$.data[1].meaningNo").value(1));
        // một bộ "Từ đã lưu", một phần, hai thẻ
        assertThat(count("SELECT count(*) FROM vocab_decks WHERE owner_id = ? AND kind = 'saved'", user)).isEqualTo(1);
        assertThat(count("SELECT count(*) FROM vocab_groups g JOIN vocab_decks d ON d.id = g.deck_id "
                + "WHERE d.owner_id = ?", user)).isEqualTo(1);
        assertThat(count(SAVED_CARDS, user)).isEqualTo(2);
    }

    @Test
    void save_fromALessonSentence_keepsTheSentenceAsContext_AC_HT_45() throws Exception {
        UUID user = data.newUser();
        insertWord(base, PRESENT);
        UUID lesson = data.newLesson("vocab-" + base, false, "published", false);
        UUID sentence = data.newSentence(lesson, 0, "I bought him a " + base + ".", "Tôi mua cho anh ấy một món quà.");

        save(user, base, 2, sentence).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.source").value("lesson"))
                .andExpect(jsonPath("$.data.lesson.lessonId").value(lesson.toString()))
                .andExpect(jsonPath("$.data.lesson.sentenceId").value(sentence.toString()))
                .andExpect(jsonPath("$.data.contextEn").value("I bought him a " + base + "."))
                .andExpect(jsonPath("$.data.contextVi").value("Tôi mua cho anh ấy một món quà."));
    }

    @Test
    void save_inflectedForm_isRefused_theLemmaMeaningIsSaved_AC_HT_45() throws Exception {
        UUID user = data.newUser();
        UUID lemma = insertWord(base, PRESENT);
        jdbc.update("INSERT INTO dictionary_words (id, headword, lemma_id, meanings) VALUES (?, ?, ?, CAST(? AS jsonb))",
                UUID.randomUUID(), base + "ed", lemma, PRESENT);
        UUID lesson = data.newLesson("vocabform-" + base, false, "published", false);
        UUID sentence = data.newSentence(lesson, 0, "They " + base + "ed it.", null);

        save(user, base + "ed", 1, sentence).andExpect(status().isNotFound());
        save(user, base, 1, sentence).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.headword").value(base))
                .andExpect(jsonPath("$.data.contextEn").value("They " + base + "ed it."));

        as(user, get(SAVED)).andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void save_fromAProLessonSentence_isRefusedForAFreeUser() throws Exception {
        UUID user = data.newUser();
        insertWord(base, PRESENT);
        UUID lesson = data.newLesson("vocabpro-" + base, true, "published", false);
        UUID sentence = data.newSentence(lesson, 0, "A pro sentence.", null);

        save(user, base, 1, sentence).andExpect(status().isForbidden());

        as(user, get(SAVED)).andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void save_fromAnUnknownSentence_is404() throws Exception {
        UUID user = data.newUser();
        insertWord(base, PRESENT);

        save(user, base, 1, UUID.randomUUID()).andExpect(status().isNotFound());
    }

    @Test
    void save_unknownWordOrMeaning_is404() throws Exception {
        UUID user = data.newUser();
        insertWord(base, PRESENT);

        save(user, base + "x", 1, null).andExpect(status().isNotFound());
        save(user, base, 9, null).andExpect(status().isNotFound());
    }

    @Test
    void save_invalidRequest_is400() throws Exception {
        UUID user = data.newUser();

        as(user, put(SAVED).contentType(MediaType.APPLICATION_JSON).content("{\"headword\":\"\",\"meaningNo\":1}"))
                .andExpect(status().isBadRequest());
        as(user, put(SAVED).contentType(MediaType.APPLICATION_JSON).content("{\"headword\":\"a\",\"meaningNo\":0}"))
                .andExpect(status().isBadRequest());
        as(user, put(SAVED).contentType(MediaType.APPLICATION_JSON).content("{\"headword\":\"a\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void save_normalizesTheHeadword() throws Exception {
        UUID user = data.newUser();
        insertWord(base, PRESENT);

        save(user, "  " + base.toUpperCase() + "! ", 1, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.headword").value(base));
    }

    // ---------------------------------------------------------------- bỏ lưu

    @Test
    void unsave_hidesTheCardAndRestoreKeepsTheProgress_AC_HT_46() throws Exception {
        UUID user = data.newUser();
        insertWord(base, PRESENT);
        String id = save(user, base, 1, null).andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"data\":\\{\"id\":\"([^\"]+)\".*", "$1");
        UUID card = UUID.fromString(id);
        Instant nextReview = Instant.now().plus(6, ChronoUnit.DAYS);
        jdbc.update("""
                INSERT INTO user_card_progress (user_id, card_id, repetitions, interval_days, due_at)
                VALUES (?, ?, 2, 6, ?)""", user, card, Timestamp.from(nextReview));

        as(user, get(SAVED)).andExpect(jsonPath("$.data[0].status").value("reviewing"))
                .andExpect(jsonPath("$.data[0].due").value(false));

        as(user, delete(SAVED + "/" + id)).andExpect(status().isOk());
        as(user, get(SAVED)).andExpect(jsonPath("$.data.length()").value(0));
        assertThat(count("SELECT count(*) FROM user_card_progress WHERE card_id = ?", card)).isEqualTo(1);

        save(user, base, 1, null).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("reviewing"))
                .andExpect(jsonPath("$.data.due").value(false));
        assertThat(count("SELECT count(*) FROM vocab_cards WHERE id = ? AND deleted_at IS NULL", card)).isEqualTo(1);
        assertThat(count(SAVED_CARDS, user)).isEqualTo(1);
    }

    @Test
    void list_marksACardDueOnceItsReviewTimeHasPassed() throws Exception {
        UUID user = data.newUser();
        insertWord(base, PRESENT);
        save(user, base, 1, null).andExpect(status().isOk());
        UUID card = jdbc.queryForObject("SELECT c.id FROM vocab_cards c JOIN vocab_decks d ON d.id = c.deck_id "
                + "WHERE d.owner_id = ? AND d.kind = 'saved'", UUID.class, user);
        jdbc.update("""
                INSERT INTO user_card_progress (user_id, card_id, repetitions, interval_days, due_at)
                VALUES (?, ?, 1, 1, ?)""", user, card, Timestamp.from(Instant.now().minusSeconds(3600)));

        as(user, get(SAVED)).andExpect(jsonPath("$.data[0].status").value("learning"))
                .andExpect(jsonPath("$.data[0].due").value(true));
    }

    @Test
    void unsave_unknownOrOthersWord_is404AndLeavesTheOwnerUntouched_AC_HT_47() throws Exception {
        UUID owner = data.newUser();
        UUID other = data.newUser();
        insertWord(base, PRESENT);
        String id = save(owner, base, 1, null).andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"data\":\\{\"id\":\"([^\"]+)\".*", "$1");

        as(other, get(SAVED)).andExpect(jsonPath("$.data.length()").value(0));
        as(other, delete(SAVED + "/" + id)).andExpect(status().isNotFound());
        as(owner, delete(SAVED + "/" + UUID.randomUUID())).andExpect(status().isNotFound());

        as(owner, get(SAVED)).andExpect(jsonPath("$.data.length()").value(1));
        save(other, base, 1, null).andExpect(status().isOk());
        as(owner, get(SAVED)).andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void unsave_twice_secondIs404() throws Exception {
        UUID user = data.newUser();
        insertWord(base, PRESENT);
        String id = save(user, base, 1, null).andReturn().getResponse().getContentAsString()
                .replaceAll(".*\"data\":\\{\"id\":\"([^\"]+)\".*", "$1");

        as(user, delete(SAVED + "/" + id)).andExpect(status().isOk());
        as(user, delete(SAVED + "/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void endpoints_requireLogin() throws Exception {
        mockMvc.perform(get(SAVED)).andExpect(status().isUnauthorized());
    }
}
