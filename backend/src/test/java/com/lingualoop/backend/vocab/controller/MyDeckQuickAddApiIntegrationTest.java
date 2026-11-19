package com.lingualoop.backend.vocab.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.Arrays;
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
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.vocab.DeckManageTestData;
import com.lingualoop.backend.vocab.VocabTestData;

/**
 * Thêm thẻ nhanh vào "Bộ của tôi" từ một nghĩa trong từ điển hoặc câu của bài học (UC-HT-10, BR-HT-28) trên Postgres
 * thật. Mỗi test dùng học viên và mục từ riêng nên không đụng nhau.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class, VocabTestData.class, DeckManageTestData.class})
class MyDeckQuickAddApiIntegrationTest {

    private static final String DECKS = "/api/v1/vocab/my-decks";
    private static final String MEANINGS = """
            [{"no":1,"pos":"noun","meaning_vi":"hóa đơn","definition_en":"a bill","example_en":"Send the invoice.","example_vi":"Gửi hóa đơn."},
             {"no":2,"pos":"verb","meaning_vi":"lập hóa đơn"}]""";

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DictationTestData users;
    @Autowired private VocabTestData vocab;
    @Autowired private DeckManageTestData teachers;

    private ResultActions as(UUID user, AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + users.tokenFor(user)));
    }

    private static AbstractMockHttpServletRequestBuilder<?> json(AbstractMockHttpServletRequestBuilder<?> request,
            String body) {
        return request.contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private UUID idOf(ResultActions result) throws Exception {
        String id = JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.data.id");
        return UUID.fromString(id);
    }

    private UUID deck(UUID user, String name) throws Exception {
        return idOf(as(user, json(post(DECKS), "{\"name\":\"" + name + "\"}")).andExpect(status().isCreated()));
    }

    private UUID group(UUID user, UUID deck, String name) throws Exception {
        return idOf(as(user, json(post(DECKS + "/" + deck + "/groups"), "{\"name\":\"" + name + "\"}"))
                .andExpect(status().isCreated()));
    }

    private static String quick(UUID deck, UUID group) {
        return DECKS + "/" + deck + "/groups/" + group + "/cards/from-dictionary";
    }

    private static String body(String headword, int meaningNo, UUID sentenceId) {
        String sentence = sentenceId == null ? "" : ",\"sentenceId\":\"" + sentenceId + "\"";
        return "{\"headword\":\"" + headword + "\",\"meaningNo\":" + meaningNo + sentence + "}";
    }

    /** Mục từ điển tên duy nhất, có phiên âm và âm thanh mặc định. */
    private String word(String meaningsJson) {
        String headword = "qa" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        jdbc.update("""
                INSERT INTO dictionary_words (id, headword, ipa_uk, ipa_us, audio_uk, audio_us, meanings)
                VALUES (?, ?, '/ˈɪnvɔɪs/', '/ˈɪnvɔɪs/', 'audio/q-uk.mp3', 'audio/q-us.mp3', CAST(? AS jsonb))""",
                UUID.randomUUID(), headword, meaningsJson);
        return headword;
    }

    private List<String> audioOf(UUID card) {
        return jdbc.queryForObject("SELECT audio_uk_url, audio_us_url FROM vocab_cards WHERE id = ?",
                (rs, i) -> Arrays.asList(rs.getString(1), rs.getString(2)), card);
    }

    // ── AC-HT-70: từ ô tra từ điển ──

    @Test
    void fromTheDictionary_addsACardWithTheMeaningContentAtTheEndOfTheGroup_AC_HT_70() throws Exception {
        UUID user = users.newUser();
        UUID deck = deck(user, "TOEIC cần nhớ");
        UUID group = group(user, deck, "Văn phòng");
        as(user, json(post(DECKS + "/" + deck + "/groups/" + group + "/cards"),
                "{\"word\":\"first\",\"meaningVi\":\"đầu tiên\"}")).andExpect(status().isCreated());
        String headword = word(MEANINGS);

        ResultActions created = as(user, json(post(quick(deck, group)), body(headword, 1, null)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.word").value(headword))
                .andExpect(jsonPath("$.data.pos").value("noun"))
                .andExpect(jsonPath("$.data.meaningVi").value("hóa đơn"))
                .andExpect(jsonPath("$.data.definitionEn").value("a bill"))
                .andExpect(jsonPath("$.data.exampleEn").value("Send the invoice."))
                .andExpect(jsonPath("$.data.exampleVi").value("Gửi hóa đơn."));
        UUID card = idOf(created);

        // âm thanh theo từ điển, thẻ ở cuối nhóm, trạng thái Mới và học được ngay
        assertThat(audioOf(card)).containsExactly("audio/q-uk.mp3", "audio/q-us.mp3");
        as(user, get(DECKS + "/" + deck + "/groups/" + group + "/cards"))
                .andExpect(jsonPath("$.data.items.length()").value(2))
                .andExpect(jsonPath("$.data.items[1].word").value(headword));
        as(user, get("/api/v1/vocab/decks/" + deck + "/parts/1")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cards.length()").value(2))
                .andExpect(jsonPath("$.data.cards[1].status").value("new"));
        // thẻ không gắn câu bài học
        Long withSentence = jdbc.queryForObject(
                "SELECT count(*) FROM vocab_cards WHERE id = ? AND source_sentence_id IS NOT NULL", Long.class, card);
        assertThat(withSentence).isZero();
    }

    // ── AC-HT-71: từ câu bài học ──

    @Test
    void fromALessonSentence_keepsTheSentenceTranslationAndLesson_AC_HT_71() throws Exception {
        UUID user = users.newUser();
        UUID deck = deck(user, "Bộ B");
        UUID group = group(user, deck, "Văn phòng");
        String headword = word(MEANINGS);
        UUID lesson = users.newLesson("quick-" + headword, false, "published", false);
        UUID sentence = users.newSentence(lesson, 0, "Please send the " + headword + " today.", "Hãy gửi hóa đơn hôm nay.");

        UUID card = idOf(as(user, json(post(quick(deck, group)), body(headword, 1, sentence)))
                .andExpect(status().isCreated()));

        vocab.progress(user, card, 2, 6, "now() - interval '5 minutes'");
        as(user, get("/api/v1/vocab/review")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cards[0].contextEn").value("Please send the " + headword + " today."))
                .andExpect(jsonPath("$.data.cards[0].contextVi").value("Hãy gửi hóa đơn hôm nay."))
                .andExpect(jsonPath("$.data.cards[0].lesson.id").value(lesson.toString()));
    }

    // ── AC-HT-72: bộ và nhóm vừa tạo ──

    @Test
    void intoADeckAndGroupJustCreated_theFirstCardGoesToTheDefaultGroup_AC_HT_72() throws Exception {
        UUID user = users.newUser();
        UUID deck = deck(user, "Công sở");
        // bộ chưa có nhóm: giao diện tạo nhóm "Từ mới" rồi thêm thẻ vào đó
        UUID group = group(user, deck, "Từ mới");
        String headword = word(MEANINGS);

        as(user, json(post(quick(deck, group)), body(headword, 2, null))).andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.pos").value("verb"))
                .andExpect(jsonPath("$.data.meaningVi").value("lập hóa đơn"));
        as(user, get(DECKS + "/" + deck)).andExpect(jsonPath("$.data.groups.length()").value(1))
                .andExpect(jsonPath("$.data.groups[0].name").value("Từ mới"))
                .andExpect(jsonPath("$.data.groups[0].cardCount").value(1));
    }

    // ── AC-HT-73: từ đã có trong bộ ──

    @Test
    void aWordAlreadyInTheDeck_isRefusedAndTheGroupHoldingItIsNamed_AC_HT_73() throws Exception {
        UUID user = users.newUser();
        UUID deck = deck(user, "Bộ C");
        UUID office = group(user, deck, "Văn phòng");
        UUID travel = group(user, deck, "Du lịch");
        String headword = word(MEANINGS);
        UUID first = idOf(as(user, json(post(quick(deck, office)), body(headword, 1, null))).andExpect(status().isCreated()));

        // nghĩa khác của cùng từ vào nhóm khác của cùng bộ vẫn bị chặn (BR-HT-26)
        as(user, json(post(quick(deck, travel)), body(headword, 2, null))).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VOCAB_CARD_WORD_TAKEN"))
                .andExpect(jsonPath("$.details.cardId").value(first.toString()))
                .andExpect(jsonPath("$.details.groupName").value("Văn phòng"));
        as(user, get(DECKS + "/" + deck + "/groups/" + travel + "/cards"))
                .andExpect(jsonPath("$.data.items.length()").value(0));

        // bộ khác của cùng học viên thì thêm được
        UUID other = deck(user, "Bộ D");
        UUID otherGroup = group(user, other, "Từ mới");
        as(user, json(post(quick(other, otherGroup)), body(headword, 1, null))).andExpect(status().isCreated());
    }

    // ── AC-HT-74: không dùng được ──

    @Test
    void missingMeaningForeignDeckOrForbiddenLesson_areRefused_AC_HT_74() throws Exception {
        UUID owner = users.newUser();
        UUID stranger = users.newUser();
        UUID deck = deck(owner, "Bộ E");
        UUID group = group(owner, deck, "Văn phòng");
        String headword = word(MEANINGS);

        as(owner, json(post(quick(deck, group)), body(headword + "zz", 1, null))).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("VOCAB_MEANING_NOT_FOUND"));
        as(owner, json(post(quick(deck, group)), body(headword, 9, null))).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("VOCAB_MEANING_NOT_FOUND"));
        as(owner, json(post(quick(deck, group)), body(headword, 1, UUID.randomUUID()))).andExpect(status().isNotFound());
        UUID proLesson = users.newLesson("quickpro-" + headword, true, "published", false);
        UUID proSentence = users.newSentence(proLesson, 0, "A pro sentence.", null);
        as(owner, json(post(quick(deck, group)), body(headword, 1, proSentence))).andExpect(status().isForbidden());

        // bộ và nhóm của người khác, nhóm không có: không tìm thấy (BR-HT-06)
        as(stranger, json(post(quick(deck, group)), body(headword, 1, null))).andExpect(status().isNotFound());
        as(owner, json(post(quick(deck, UUID.randomUUID())), body(headword, 1, null))).andExpect(status().isNotFound());

        // yêu cầu sai dạng
        as(owner, json(post(quick(deck, group)), "{\"headword\":\"  \",\"meaningNo\":1}")).andExpect(status().isBadRequest());
        as(owner, json(post(quick(deck, group)), "{\"headword\":\"" + headword + "\",\"meaningNo\":0}"))
                .andExpect(status().isBadRequest());

        // không thẻ nào được thêm
        as(owner, get(DECKS + "/" + deck + "/groups/" + group + "/cards"))
                .andExpect(jsonPath("$.data.items.length()").value(0));
    }

    @Test
    void teachersAreRefusedAndAnonymousIs401_AC_HT_74() throws Exception {
        UUID owner = users.newUser();
        UUID deck = deck(owner, "Bộ F");
        UUID group = group(owner, deck, "Văn phòng");
        String headword = word(MEANINGS);
        UUID teacher = teachers.teacher("GV");

        mockMvc.perform(json(post(quick(deck, group)), body(headword, 1, null)).header(HttpHeaders.AUTHORIZATION,
                "Bearer " + teachers.tokenFor(teacher, Role.TEACHER))).andExpect(status().isForbidden());
        mockMvc.perform(json(post(quick(deck, group)), body(headword, 1, null))).andExpect(status().isUnauthorized());
    }

    // ── BR-HT-28: cắt độ dài, loại từ ──

    @Test
    void longTextIsClipped_andAPartOfSpeechOutsideTheListIsLeftEmpty_BR_HT_28() throws Exception {
        UUID user = users.newUser();
        UUID deck = deck(user, "Bộ G");
        UUID group = group(user, deck, "Văn phòng");
        String longMeaning = "nghĩa ".repeat(120);
        String headword = word("[{\"no\":1,\"pos\":\"abbreviation\",\"meaning_vi\":\"" + longMeaning + "\"}]");

        as(user, json(post(quick(deck, group)), body(headword, 1, null))).andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.pos").doesNotExist())
                .andExpect(jsonPath("$.data.meaningVi").value(longMeaning.substring(0, 500)));
    }
}
