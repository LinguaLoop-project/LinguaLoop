package com.lingualoop.backend.vocab.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

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

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.vocab.DeckManageTestData;
import com.lingualoop.backend.vocab.VocabTestData;

/**
 * "Bộ của tôi" (UC-HT-08) trên Postgres thật: thêm, đổi tên, xóa bộ cá nhân (BR-HT-25) và quyền riêng tư (BR-HT-06).
 * Mỗi test dùng học viên riêng nên không đụng nhau.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DictationTestData.class, VocabTestData.class, DeckManageTestData.class})
class MyDeckApiIntegrationTest {

    private static final String DECKS = "/api/v1/vocab/my-decks";

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DictationTestData users;
    @Autowired private VocabTestData vocab;
    @Autowired private DeckManageTestData teachers;

    private ResultActions as(UUID user, AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + users.tokenFor(user)));
    }

    private static AbstractMockHttpServletRequestBuilder<?> json(AbstractMockHttpServletRequestBuilder<?> request,
            String name) {
        String body = name == null ? "{}" : "{\"name\":\"" + name + "\"}";
        return request.contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private UUID create(UUID user, String name) throws Exception {
        String id = com.jayway.jsonpath.JsonPath.read(
                as(user, json(post(DECKS), name)).andExpect(status().isCreated()).andReturn().getResponse()
                        .getContentAsString(), "$.data.id");
        return UUID.fromString(id);
    }

    // ── AC-HT-55: thêm bộ ──

    @Test
    void create_validName_returnsTheDeckAndListsItForTheOwner_AC_HT_55() throws Exception {
        UUID user = users.newUser();

        as(user, json(post(DECKS), "Từ vựng công sở")).andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Từ vựng công sở"))
                .andExpect(jsonPath("$.data.cardCount").value(0))
                .andExpect(jsonPath("$.data.dueCount").value(0));

        as(user, get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].name").value("Từ vựng công sở"));
    }

    @Test
    void create_trimsTheName_andAcceptsExactly100Characters_AC_HT_55() throws Exception {
        UUID user = users.newUser();
        String hundred = "a".repeat(100);

        as(user, json(post(DECKS), "   Từ vựng   ")).andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("Từ vựng"));
        as(user, json(post(DECKS), hundred)).andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value(hundred));
    }

    @Test
    void list_showsOnlyTheLearnersOwnPersonalDecks_newestFirst_BR_HT_06() throws Exception {
        UUID user = users.newUser();
        UUID other = users.newUser();
        create(user, "Cũ");
        create(user, "Mới");
        create(other, "Của người khác");
        // bộ "Từ đã lưu" và bộ thư viện không phải bộ cá nhân
        jdbc.update("INSERT INTO vocab_decks (owner_id, kind, name) VALUES (?, 'saved', 'Từ đã lưu')", user);
        vocab.deck("md" + UUID.randomUUID().toString().substring(0, 6), false);

        as(user, get(DECKS)).andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].name").value("Mới"))
                .andExpect(jsonPath("$.data[1].name").value("Cũ"));
    }

    @Test
    void list_countsCardsAndDueCards_BR_HT_06() throws Exception {
        UUID user = users.newUser();
        UUID deck = create(user, "Có thẻ");
        List<UUID> cards = vocab.fill(deck, 1, 3, "md" + UUID.randomUUID().toString().substring(0, 6));
        vocab.progress(user, cards.get(0), 2, 6, "now() - interval '5 minutes'");
        vocab.progress(user, cards.get(1), 2, 6, "now() + interval '3 days'");

        as(user, get(DECKS)).andExpect(jsonPath("$.data[0].cardCount").value(3))
                .andExpect(jsonPath("$.data[0].dueCount").value(1));
    }

    // ── AC-HT-57: tên không hợp lệ ──

    @Test
    void create_blankOrTooLongName_returns400WithNameError_AC_HT_57() throws Exception {
        UUID user = users.newUser();

        as(user, json(post(DECKS), null)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
        as(user, json(post(DECKS), "   ")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
        as(user, json(post(DECKS), "a".repeat(101))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].code").value("Size"));

        as(user, get(DECKS)).andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void create_duplicateNameOfTheSameLearner_returns409_butAnotherLearnerMayUseIt_AC_HT_57() throws Exception {
        UUID user = users.newUser();
        create(user, "TOEIC cần nhớ");

        as(user, json(post(DECKS), "TOEIC cần nhớ")).andExpect(status().isConflict());
        // không phân biệt hoa thường và khoảng trắng hai đầu
        as(user, json(post(DECKS), "  toeic CẦN nhớ ")).andExpect(status().isConflict());
        as(user, get(DECKS)).andExpect(jsonPath("$.data.length()").value(1));

        create(users.newUser(), "TOEIC cần nhớ");
    }

    // ── AC-HT-56: sửa và xóa ──

    @Test
    void rename_updatesTheNameInTheList_AC_HT_56() throws Exception {
        UUID user = users.newUser();
        UUID deck = create(user, "Từ vựng công sở");

        as(user, json(put(DECKS + "/" + deck), "Tiếng Anh giao tiếp")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Tiếng Anh giao tiếp"));
        as(user, get(DECKS)).andExpect(jsonPath("$.data[0].name").value("Tiếng Anh giao tiếp"));
        // đặt lại đúng tên hiện tại (kể cả đổi hoa thường) không phải lỗi trùng
        as(user, json(put(DECKS + "/" + deck), "tiếng anh giao tiếp")).andExpect(status().isOk());
    }

    @Test
    void rename_invalidOrDuplicateName_isRejectedAndKeepsTheOldName_AC_HT_57() throws Exception {
        UUID user = users.newUser();
        create(user, "TOEIC cần nhớ");
        UUID deck = create(user, "Từ vựng công sở");
        String path = DECKS + "/" + deck;

        as(user, json(put(path), "")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
        as(user, json(put(path), "a".repeat(101))).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("Size"));
        as(user, json(put(path), "TOEIC cần nhớ")).andExpect(status().isConflict());

        as(user, get(DECKS)).andExpect(jsonPath("$.data[?(@.id=='" + deck + "')].name").value("Từ vựng công sở"));
    }

    @Test
    void delete_removesTheDeck_itsCardsLeaveTheReviewQueue_andTheNameCanBeReused_AC_HT_56() throws Exception {
        UUID user = users.newUser();
        UUID deck = create(user, "Từ vựng công sở");
        List<UUID> cards = vocab.fill(deck, 1, 2, "md" + UUID.randomUUID().toString().substring(0, 6));
        for (UUID card : cards) {
            vocab.progress(user, card, 2, 6, "now() - interval '5 minutes'");
        }
        as(user, get("/api/v1/vocab/review")).andExpect(jsonPath("$.data.dueTotal").value(2));

        as(user, delete(DECKS + "/" + deck)).andExpect(status().isOk());

        as(user, get(DECKS)).andExpect(jsonPath("$.data.length()").value(0));
        as(user, get("/api/v1/vocab/review")).andExpect(jsonPath("$.data.dueTotal").value(0));
        // thẻ và tiến độ vẫn còn, bộ chỉ bị xóa tạm
        Long kept = jdbc.queryForObject("SELECT count(*) FROM vocab_cards WHERE deck_id = ? AND deleted_at IS NULL",
                Long.class, deck);
        org.assertj.core.api.Assertions.assertThat(kept).isEqualTo(2);
        create(user, "Từ vựng công sở");
    }

    // ── BR-HT-06: riêng tư và quyền ──

    @Test
    void renameAndDelete_deckOfAnotherLearnerOrNotPersonalOrAlreadyDeleted_return404_BR_HT_06() throws Exception {
        UUID owner = users.newUser();
        UUID stranger = users.newUser();
        UUID deck = create(owner, "Của tôi");
        UUID library = vocab.deck("md" + UUID.randomUUID().toString().substring(0, 6), false);

        as(stranger, json(put(DECKS + "/" + deck), "Cướp bộ")).andExpect(status().isNotFound());
        as(stranger, delete(DECKS + "/" + deck)).andExpect(status().isNotFound());
        as(owner, json(put(DECKS + "/" + library), "Đổi bộ thư viện")).andExpect(status().isNotFound());
        as(owner, delete(DECKS + "/" + library)).andExpect(status().isNotFound());
        as(owner, get(DECKS)).andExpect(jsonPath("$.data[0].name").value("Của tôi"));

        as(owner, delete(DECKS + "/" + deck)).andExpect(status().isOk());
        as(owner, delete(DECKS + "/" + deck)).andExpect(status().isNotFound());
        as(owner, json(put(DECKS + "/" + deck), "Sau khi xóa")).andExpect(status().isNotFound());
    }

    @Test
    void myDecks_forTeachersAndAdmins_return403() throws Exception {
        UUID teacher = teachers.teacher("GV");

        mockMvc.perform(json(post(DECKS), "Bộ của giáo viên")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + teachers.tokenFor(teacher, Role.TEACHER)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(DECKS)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + teachers.tokenFor(teacher, Role.TEACHER)))
                .andExpect(status().isForbidden());
    }

    @Test
    void myDecks_withoutToken_return401() throws Exception {
        mockMvc.perform(get(DECKS)).andExpect(status().isUnauthorized());
        mockMvc.perform(json(post(DECKS), "x")).andExpect(status().isUnauthorized());
        mockMvc.perform(delete(DECKS + "/" + UUID.randomUUID())).andExpect(status().isUnauthorized());
    }
}
