package com.lingualoop.backend.vocab.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
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
 * Nhóm thẻ và thẻ trong "Bộ của tôi" (UC-HT-09) trên Postgres thật: thêm, sửa, xóa, nhập tệp, quyền riêng tư và việc
 * học và ôn thẻ của bộ cá nhân (BR-HT-26, BR-HT-27). Mỗi test dùng học viên riêng nên không đụng nhau.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class, VocabTestData.class, DeckManageTestData.class})
class MyDeckContentApiIntegrationTest {

    private static final String DECKS = "/api/v1/vocab/my-decks";
    private static final String HEADER = "Từ vựng,Nghĩa tiếng Việt,Phiên âm UK,Phiên âm US,Loại từ,"
            + "Định nghĩa (tiếng Anh),Định nghĩa (tiếng Việt),Ví dụ (tiếng Anh),Ví dụ (tiếng Việt)";

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

    private static String nameJson(String name) {
        return "{\"name\":\"" + name + "\"}";
    }

    private static String cardJson(String word, String meaning) {
        return "{\"word\":\"" + word + "\",\"meaningVi\":\"" + meaning + "\"}";
    }

    private UUID idOf(ResultActions result) throws Exception {
        String id = JsonPath.read(result.andReturn().getResponse().getContentAsString(), "$.data.id");
        return UUID.fromString(id);
    }

    private UUID deck(UUID user, String name) throws Exception {
        return idOf(as(user, json(post(DECKS), nameJson(name))).andExpect(status().isCreated()));
    }

    private UUID group(UUID user, UUID deck, String name) throws Exception {
        return idOf(as(user, json(post(DECKS + "/" + deck + "/groups"), nameJson(name))).andExpect(status().isCreated()));
    }

    private UUID card(UUID user, UUID deck, UUID group, String word, String meaning) throws Exception {
        return idOf(as(user, json(post(cards(deck, group)), cardJson(word, meaning))).andExpect(status().isCreated()));
    }

    private static String cards(UUID deck, UUID group) {
        return DECKS + "/" + deck + "/groups/" + group + "/cards";
    }

    private static String groupPath(UUID deck, UUID group) {
        return DECKS + "/" + deck + "/groups/" + group;
    }

    private static MockMultipartFile csv(String body) {
        return new MockMultipartFile("file", "the.csv", "text/csv", body.getBytes(StandardCharsets.UTF_8));
    }

    private void dueNow(UUID user, UUID card) {
        vocab.progress(user, card, 2, 6, "now() - interval '5 minutes'");
    }

    // ── AC-HT-62: thêm nhóm và thẻ rồi học được ngay ──

    @Test
    void addGroupAndCard_thenTheDeckIsLearnableAndReviewable_AC_HT_62() throws Exception {
        UUID user = users.newUser();
        UUID deck = deck(user, "TOEIC cần nhớ");

        // bộ chưa có nhóm nào vẫn mở được ở trang học, chưa có phần nào
        as(user, get("/api/v1/vocab/decks/" + deck)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.deck.name").value("TOEIC cần nhớ"))
                .andExpect(jsonPath("$.data.parts.length()").value(0));

        UUID group = group(user, deck, "Văn phòng");
        UUID card = card(user, deck, group, "invoice", "hóa đơn");

        as(user, get("/api/v1/vocab/decks/" + deck)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.parts.length()").value(1))
                .andExpect(jsonPath("$.data.parts[0].name").value("Văn phòng"))
                .andExpect(jsonPath("$.data.parts[0].cardCount").value(1))
                .andExpect(jsonPath("$.data.parts[0].locked").value(false));
        as(user, get("/api/v1/vocab/decks/" + deck + "/parts/1")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cards.length()").value(1))
                .andExpect(jsonPath("$.data.cards[0].word").value("invoice"))
                .andExpect(jsonPath("$.data.cards[0].status").value("new"))
                // đánh dấu bộ cá nhân để giao diện không hiện nút báo lỗi thẻ (không có giáo viên nhận báo cáo)
                .andExpect(jsonPath("$.data.deck.personal").value(true));

        // bộ cá nhân không nằm trong danh sách bộ thư viện (BR-HT-27)
        as(user, get("/api/v1/vocab/decks")).andExpect(jsonPath("$.data.decks[?(@.id=='" + deck + "')]").isEmpty());

        // sau khi học, thẻ vào hàng đợi ôn chung và ôn riêng theo bộ được
        dueNow(user, card);
        as(user, get("/api/v1/vocab/review")).andExpect(jsonPath("$.data.dueTotal").value(1));
        as(user, get("/api/v1/vocab/review").param("deck", deck.toString()))
                .andExpect(jsonPath("$.data.cards.length()").value(1))
                .andExpect(jsonPath("$.data.deck.personal").value(true));
    }

    // ── AC-HT-63: sửa giữ vị trí và tiến độ ──

    @Test
    void updateCardAndRenameGroup_keepPositionAndProgress_AC_HT_63() throws Exception {
        UUID user = users.newUser();
        UUID deck = deck(user, "Bộ A");
        UUID group = group(user, deck, "Văn phòng");
        card(user, deck, group, "alpha", "một");
        UUID second = card(user, deck, group, "invoice", "hóa đơn");
        card(user, deck, group, "omega", "ba");
        dueNow(user, second);

        as(user, json(put(cards(deck, group) + "/" + second), cardJson("invoice", "hóa đơn thanh toán")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.meaningVi").value("hóa đơn thanh toán"));
        as(user, json(put(groupPath(deck, group)), nameJson("Công sở"))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Công sở"))
                .andExpect(jsonPath("$.data.cardCount").value(3));

        as(user, get(cards(deck, group))).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[1].word").value("invoice"))
                .andExpect(jsonPath("$.data.items[1].meaningVi").value("hóa đơn thanh toán"))
                .andExpect(jsonPath("$.data.items.length()").value(3));
        Long progress = jdbc.queryForObject(
                "SELECT count(*) FROM user_card_progress WHERE user_id = ? AND card_id = ? AND repetitions = 2",
                Long.class, user, second);
        assertThat(progress).isEqualTo(1);
    }

    // ── AC-HT-64: xóa thẻ và nhóm thì rời hàng đợi ôn ──

    @Test
    void deleteCardAndGroup_leaveTheReviewQueue_andTheDeckRemains_AC_HT_64() throws Exception {
        UUID user = users.newUser();
        UUID deck = deck(user, "Bộ B");
        UUID group = group(user, deck, "Văn phòng");
        UUID first = card(user, deck, group, "alpha", "một");
        UUID second = card(user, deck, group, "bravo", "hai");
        dueNow(user, first);
        dueNow(user, second);
        as(user, get("/api/v1/vocab/review")).andExpect(jsonPath("$.data.dueTotal").value(2));

        as(user, delete(cards(deck, group) + "/" + first)).andExpect(status().isNoContent());
        as(user, get("/api/v1/vocab/review")).andExpect(jsonPath("$.data.dueTotal").value(1));

        as(user, delete(groupPath(deck, group))).andExpect(status().isNoContent());
        as(user, get("/api/v1/vocab/review")).andExpect(jsonPath("$.data.dueTotal").value(0));

        // bộ vẫn còn, không còn nhóm nào (không có luật xuất bản); thẻ chỉ bị xóa tạm
        as(user, get(DECKS + "/" + deck)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.groups.length()").value(0));
        Long kept = jdbc.queryForObject("SELECT count(*) FROM vocab_cards WHERE deck_id = ?", Long.class, deck);
        assertThat(kept).isEqualTo(2);
    }

    // ── AC-HT-65: trùng và không hợp lệ ──

    @Test
    void duplicateWordOrGroupNameAndInvalidFields_areRejected_AC_HT_65() throws Exception {
        UUID user = users.newUser();
        UUID deck = deck(user, "Bộ C");
        UUID office = group(user, deck, "Văn phòng");
        UUID travel = group(user, deck, "Du lịch");
        UUID existing = card(user, deck, office, "invoice", "hóa đơn");

        // từ trùng trong bộ, kể cả khác nhóm: nêu nhóm đã có thẻ
        as(user, json(post(cards(deck, travel)), cardJson("Invoice", "khác"))).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VOCAB_CARD_WORD_TAKEN"))
                .andExpect(jsonPath("$.details.cardId").value(existing.toString()))
                .andExpect(jsonPath("$.details.groupName").value("Văn phòng"));
        // thiếu nghĩa tiếng Việt, từ quá dài
        as(user, json(post(cards(deck, travel)), "{\"word\":\"ticket\"}")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("meaningVi"));
        as(user, json(post(cards(deck, travel)), cardJson("a".repeat(101), "x"))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("word"))
                .andExpect(jsonPath("$.errors[0].code").value("Size"));
        // tên nhóm trùng (không phân biệt hoa thường), trống, quá dài
        as(user, json(post(DECKS + "/" + deck + "/groups"), nameJson("văn PHÒNG"))).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VOCAB_GROUP_NAME_TAKEN"));
        as(user, json(post(DECKS + "/" + deck + "/groups"), nameJson("   "))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
        as(user, json(post(DECKS + "/" + deck + "/groups"), nameJson("a".repeat(101)))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("Size"));

        as(user, get(cards(deck, travel))).andExpect(jsonPath("$.data.items.length()").value(0));
        as(user, get(DECKS + "/" + deck)).andExpect(jsonPath("$.data.groups.length()").value(2));
    }

    // ── AC-HT-66: nhập tệp ──

    @Test
    void importCards_validFileAddsAllInOrder_invalidFileAddsNone_AC_HT_66() throws Exception {
        UUID user = users.newUser();
        UUID deck = deck(user, "Bộ D");
        UUID group = group(user, deck, "Văn phòng");
        String path = cards(deck, group) + "/import";

        as(user, multipart(path + "/preview").file(csv(HEADER + "\ninvoice,hóa đơn\nreceipt,biên lai\nrefund,hoàn tiền")))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.cardCount").value(3));
        as(user, multipart(path).file(csv(HEADER + "\ninvoice,hóa đơn\nreceipt,biên lai\nrefund,hoàn tiền")))
                .andExpect(status().isCreated()).andExpect(jsonPath("$.data.addedCount").value(3));
        as(user, get(cards(deck, group))).andExpect(jsonPath("$.data.items.length()").value(3))
                .andExpect(jsonPath("$.data.items[0].word").value("invoice"))
                .andExpect(jsonPath("$.data.items[2].word").value("refund"));

        // dòng 4 (theo cách đếm của Excel) thiếu nghĩa: không thẻ nào được thêm
        as(user, multipart(path).file(csv(HEADER + "\nticket,vé\nvisa,thị thực\nmenu,")))
                .andExpect(jsonPath("$.code").value("VOCAB_IMPORT_ROWS_INVALID"))
                .andExpect(jsonPath("$.details.errors[0].row").value(4))
                .andExpect(jsonPath("$.details.errors[0].field").value("meaningVi"));
        as(user, get(cards(deck, group))).andExpect(jsonPath("$.data.items.length()").value(3));

        as(user, get(DECKS + "/card-import-template").param("format", "csv")).andExpect(status().isOk());
    }

    // ── AC-HT-67: riêng tư, vai trò và không có ảnh ──

    @Test
    void otherLearnerGets404_teacherGets403_andImagesAreRefused_AC_HT_67() throws Exception {
        UUID owner = users.newUser();
        UUID stranger = users.newUser();
        UUID deck = deck(owner, "Bộ E");
        UUID group = group(owner, deck, "Văn phòng");
        UUID card = card(owner, deck, group, "invoice", "hóa đơn");

        as(stranger, get(DECKS + "/" + deck)).andExpect(status().isNotFound());
        as(stranger, get(cards(deck, group))).andExpect(status().isNotFound());
        as(stranger, json(post(DECKS + "/" + deck + "/groups"), nameJson("Cướp"))).andExpect(status().isNotFound());
        as(stranger, json(post(cards(deck, group)), cardJson("x", "y"))).andExpect(status().isNotFound());
        as(stranger, json(put(cards(deck, group) + "/" + card), cardJson("invoice", "đã sửa")))
                .andExpect(status().isNotFound());
        as(stranger, delete(cards(deck, group) + "/" + card)).andExpect(status().isNotFound());
        as(stranger, delete(groupPath(deck, group))).andExpect(status().isNotFound());
        as(stranger, get("/api/v1/vocab/decks/" + deck)).andExpect(status().isNotFound());

        UUID teacher = teachers.teacher("GV");
        String teacherToken = "Bearer " + teachers.tokenFor(teacher, Role.TEACHER);
        mockMvc.perform(get(DECKS + "/" + deck).header(HttpHeaders.AUTHORIZATION, teacherToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(json(post(DECKS + "/" + deck + "/groups"), nameJson("GV")).header(HttpHeaders.AUTHORIZATION,
                teacherToken)).andExpect(status().isForbidden());

        // thẻ của bộ cá nhân không có ảnh
        as(owner, json(post(cards(deck, group)),
                "{\"word\":\"photo\",\"meaningVi\":\"ảnh\",\"imageKey\":\"vocab-decks/cards/x/y.png\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("image"));
        as(owner, json(put(cards(deck, group) + "/" + card),
                "{\"word\":\"invoice\",\"meaningVi\":\"hóa đơn\",\"removeImage\":true}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("image"));

        // bộ của chủ không bị ảnh hưởng
        as(owner, get(cards(deck, group))).andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.items[0].meaningVi").value("hóa đơn"));
    }

    // ── AC-HT-68: nhóm trống không học được ──

    @Test
    void emptyGroup_isAPartWithNoCards_andDoesNotBreakTheDeck_AC_HT_68() throws Exception {
        UUID user = users.newUser();
        UUID deck = deck(user, "Bộ F");
        UUID office = group(user, deck, "Văn phòng");
        group(user, deck, "Du lịch");
        card(user, deck, office, "invoice", "hóa đơn");
        card(user, deck, office, "receipt", "biên lai");

        as(user, get("/api/v1/vocab/decks/" + deck)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.parts.length()").value(2))
                .andExpect(jsonPath("$.data.parts[0].cardCount").value(2))
                .andExpect(jsonPath("$.data.parts[1].name").value("Du lịch"))
                .andExpect(jsonPath("$.data.parts[1].cardCount").value(0));
        as(user, get("/api/v1/vocab/decks/" + deck + "/parts/1")).andExpect(jsonPath("$.data.cards.length()").value(2));
        // nhóm trống vẫn hiện ở trang quản lý nội dung
        as(user, get(DECKS + "/" + deck)).andExpect(jsonPath("$.data.groups.length()").value(2));
    }

    // ── AC-HT-69: âm thanh tự lấy từ từ điển ──

    /** Một mục từ điển tên duy nhất, có âm thanh mặc định và âm thanh riêng cho động từ. */
    private String dictionaryWord() {
        String headword = "mine" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        jdbc.update("""
                INSERT INTO dictionary_words (id, headword, audio_uk, audio_us, pos_pronunciations, meanings)
                VALUES (?, ?, 'audio/n-uk.mp3', 'audio/n-us.mp3',
                        CAST('{"verb":{"ipa_uk":null,"ipa_us":null,"audio_uk":"audio/v-uk.mp3","audio_us":"audio/v-us.mp3"}}' AS jsonb),
                        CAST('[{"no":1,"pos":"noun","meaning_vi":"hồ sơ"},{"no":2,"pos":"verb","meaning_vi":"ghi lại"}]' AS jsonb))""",
                UUID.randomUUID(), headword);
        return headword;
    }

    private java.util.List<String> audioOf(UUID group, String word) {
        return jdbc.queryForObject("""
                SELECT audio_uk_url, audio_us_url FROM vocab_cards
                WHERE group_id = ? AND word = ? AND deleted_at IS NULL""",
                (rs, i) -> java.util.Arrays.asList(rs.getString(1), rs.getString(2)), group, word);
    }

    @Test
    void cardsOfWordsInTheDictionaryGetItsAudio_byHandAndByImport_AC_HT_69() throws Exception {
        UUID user = users.newUser();
        UUID deck = deck(user, "Bộ H");
        UUID group = group(user, deck, "Văn phòng");
        String word = dictionaryWord();

        // âm thanh theo từ vựng và loại từ, tự lấy mỗi lần lưu; người dùng không tải âm thanh lên
        as(user, json(post(cards(deck, group)), "{\"word\":\"" + word + "\",\"meaningVi\":\"hồ sơ\",\"pos\":\"noun\"}"))
                .andExpect(status().isCreated());
        assertThat(audioOf(group, word)).containsExactly("audio/n-uk.mp3", "audio/n-us.mp3");

        UUID cardId = UUID.fromString(jdbc.queryForObject(
                "SELECT id::text FROM vocab_cards WHERE group_id = ? AND word = ?", String.class, group, word));
        as(user, json(put(cards(deck, group) + "/" + cardId),
                "{\"word\":\"" + word + "\",\"meaningVi\":\"ghi lại\",\"pos\":\"verb\"}")).andExpect(status().isOk());
        assertThat(audioOf(group, word)).containsExactly("audio/v-uk.mp3", "audio/v-us.mp3");

        // từ không có trong từ điển thì không có âm thanh; nhập từ tệp cũng tự lấy âm thanh
        as(user, json(post(cards(deck, group)), cardJson("zzqxnotaword", "không có"))).andExpect(status().isCreated());
        assertThat(audioOf(group, "zzqxnotaword")).containsExactly(null, null);
        String imported = dictionaryWord();
        as(user, multipart(cards(deck, group) + "/import").file(csv(HEADER + "\n" + imported + ",hồ sơ")))
                .andExpect(status().isCreated());
        assertThat(audioOf(group, imported)).containsExactly("audio/n-uk.mp3", "audio/n-us.mp3");
    }

    @Test
    void personalDeckOfAnotherLearner_isNotVisibleInLearnEndpoints_BR_HT_27() throws Exception {
        UUID owner = users.newUser();
        UUID stranger = users.newUser();
        UUID deck = deck(owner, "Bộ G");

        as(owner, get("/api/v1/vocab/decks/" + deck)).andExpect(status().isOk());
        as(stranger, get("/api/v1/vocab/decks/" + deck)).andExpect(status().isNotFound());
        as(stranger, get("/api/v1/vocab/review").param("deck", deck.toString())).andExpect(status().isNotFound());

        // sau khi xóa bộ, chủ bộ cũng không còn học hay ôn riêng bộ đó
        as(owner, delete(DECKS + "/" + deck)).andExpect(status().isOk());
        as(owner, get("/api/v1/vocab/decks/" + deck)).andExpect(status().isNotFound());
    }

    @Test
    void myDeckContent_withoutToken_returns401() throws Exception {
        UUID deck = UUID.randomUUID();
        mockMvc.perform(get(DECKS + "/" + deck)).andExpect(status().isUnauthorized());
        mockMvc.perform(json(post(DECKS + "/" + deck + "/groups"), nameJson("x"))).andExpect(status().isUnauthorized());
    }
}
