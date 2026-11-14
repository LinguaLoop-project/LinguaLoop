package com.lingualoop.backend.vocab.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.endsWith;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.nullValue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.storage.service.FileStorageService;
import com.lingualoop.backend.storage.service.UploadPurpose;
import com.lingualoop.backend.vocab.DeckManageTestData;

/**
 * API nhóm thẻ và thẻ của giáo viên (UC-NT-01 đến UC-NT-07) trên Postgres thật. Mỗi test dùng giáo viên và bộ mới nên
 * không phụ thuộc dữ liệu của test khác.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DeckManageTestData.class})
class TeacherVocabContentApiIntegrationTest {

    private static final String DECKS = "/api/v1/teacher/vocab/decks/";
    private static final String HEADER = "Từ vựng,Nghĩa tiếng Việt,Phiên âm UK,Phiên âm US,Loại từ,"
            + "Định nghĩa (tiếng Anh),Định nghĩa (tiếng Việt),Ví dụ (tiếng Anh),Ví dụ (tiếng Việt)";

    @Autowired private MockMvc mockMvc;
    @Autowired private DeckManageTestData data;
    @Autowired private JdbcTemplate jdbc;
    @MockitoBean private FileStorageService storage;

    private UUID teacher;
    private UUID otherTeacher;

    @BeforeEach
    void setUp() {
        teacher = data.teacher("Cô A");
        otherTeacher = data.teacher("Thầy B");
    }

    private ResultActions as(UUID user, Role role, AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user, role)));
    }

    private ResultActions asTeacher(UUID user, AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return as(user, Role.TEACHER, request);
    }

    private static String groupsOf(UUID deck) {
        return DECKS + deck + "/groups";
    }

    private static String groupOf(UUID deck, UUID group) {
        return groupsOf(deck) + "/" + group;
    }

    private static String cardsOf(UUID deck, UUID group) {
        return groupOf(deck, group) + "/cards";
    }

    private static String json(String name) {
        return "{\"name\":\"" + name + "\"}";
    }

    private static String cardJson(String word, String meaning) {
        return "{\"word\":\"" + word + "\",\"meaningVi\":\"" + meaning + "\"}";
    }

    private UUID draftDeck() {
        return data.deck(teacher, "Bộ " + UUID.randomUUID()).insert();
    }

    private UUID publishedDeck() {
        return data.deck(teacher, "Bộ " + UUID.randomUUID()).published().insert();
    }

    private List<String> groupNames(UUID deck) {
        return jdbc.queryForList("""
                SELECT name FROM vocab_groups WHERE deck_id = ? AND deleted_at IS NULL ORDER BY created_at, id""",
                String.class, deck);
    }

    private List<String> words(UUID group) {
        return jdbc.queryForList("""
                SELECT word FROM vocab_cards WHERE group_id = ? AND deleted_at IS NULL ORDER BY created_at, id""",
                String.class, group);
    }

    /** Âm thanh UK, US đã lưu của thẻ có từ vựng {@code word} trong nhóm. */
    private List<String> audioOf(UUID group, String word) {
        return jdbc.queryForObject("""
                SELECT audio_uk_url, audio_us_url FROM vocab_cards
                WHERE group_id = ? AND word = ? AND deleted_at IS NULL""",
                (rs, i) -> Arrays.asList(rs.getString(1), rs.getString(2)), group, word);
    }

    /**
     * Một mục từ điển tên duy nhất, có âm thanh mặc định và âm thanh riêng cho động từ (như "record" đọc khác nhau theo
     * loại từ).
     */
    private String dictionaryWord() {
        String headword = "rec" + UUID.randomUUID().toString().replace("-", "").substring(0, 10);
        jdbc.update("""
                INSERT INTO dictionary_words (id, headword, audio_uk, audio_us, pos_pronunciations, meanings)
                VALUES (?, ?, 'audio/n-uk.mp3', 'audio/n-us.mp3',
                        CAST('{"verb":{"ipa_uk":null,"ipa_us":null,"audio_uk":"audio/v-uk.mp3","audio_us":"audio/v-us.mp3"}}' AS jsonb),
                        CAST('[{"no":1,"pos":"noun","meaning_vi":"hồ sơ"},{"no":2,"pos":"verb","meaning_vi":"ghi lại"}]' AS jsonb))""",
                UUID.randomUUID(), headword);
        return headword;
    }

    private Instant deckUpdatedAt(UUID deck) {
        return jdbc.queryForObject("SELECT updated_at FROM vocab_decks WHERE id = ?", Timestamp.class, deck)
                .toInstant();
    }

    private void ageDeck(UUID deck) {
        jdbc.update("UPDATE vocab_decks SET updated_at = ? WHERE id = ?",
                Timestamp.from(Instant.now().minus(1, ChronoUnit.DAYS)), deck);
    }

    // ================================================================ nhóm thẻ

    @Nested
    class AddGroup {

        @Test
        void addGroup_validName_appendsEmptyGroupAtEnd_AC_NT_01() throws Exception {
            UUID deck = draftDeck();
            data.group(deck, "Công việc", false);
            data.group(deck, "Du lịch", false);
            ageDeck(deck);

            asTeacher(teacher, post(groupsOf(deck)).contentType(MediaType.APPLICATION_JSON).content(json("Môi trường")))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.name").value("Môi trường"))
                    .andExpect(jsonPath("$.data.cardCount").value(0));

            assertThat(groupNames(deck)).containsExactly("Công việc", "Du lịch", "Môi trường");
            assertThat(deckUpdatedAt(deck)).isAfter(Instant.now().minus(1, ChronoUnit.HOURS));
        }

        @Test
        void addGroup_deckOfOtherTeacher_forbidden_AC_NT_02() throws Exception {
            UUID deck = data.deck(otherTeacher, "Bộ của B " + UUID.randomUUID()).insert();

            asTeacher(teacher, post(groupsOf(deck)).contentType(MediaType.APPLICATION_JSON).content(json("Nhóm")))
                    .andExpect(status().isForbidden());
            assertThat(groupNames(deck)).isEmpty();
        }

        @Test
        void addGroup_deletedDeck_notFound_AC_NT_03() throws Exception {
            UUID deck = data.deck(teacher, "Bộ đã xóa " + UUID.randomUUID()).deletedAt(Instant.now()).insert();

            asTeacher(teacher, post(groupsOf(deck)).contentType(MediaType.APPLICATION_JSON).content(json("Nhóm")))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("VOCAB_DECK_NOT_FOUND"));
        }

        @Test
        void addGroup_publishedDeck_rejected_AC_NT_58() throws Exception {
            UUID deck = publishedDeck();
            data.card(data.group(deck, "Nhóm 1", false), "apple", false);

            asTeacher(teacher, post(groupsOf(deck)).contentType(MediaType.APPLICATION_JSON).content(json("Nhóm 2")))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("VOCAB_DECK_MUST_STAY_PUBLISHABLE"))
                    .andExpect(jsonPath("$.details.reason").value("EMPTY_GROUP"));
            assertThat(groupNames(deck)).containsExactly("Nhóm 1");
        }

        @Test
        void addGroup_blankOrWhitespaceName_rejected_AC_NT_05() throws Exception {
            UUID deck = draftDeck();

            asTeacher(teacher, post(groupsOf(deck)).contentType(MediaType.APPLICATION_JSON).content(json("   ")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[0].field").value("name"))
                    .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
            assertThat(groupNames(deck)).isEmpty();
        }

        @Test
        void addGroup_nameOver100Chars_rejected_AC_NT_05() throws Exception {
            UUID deck = draftDeck();

            asTeacher(teacher, post(groupsOf(deck)).contentType(MediaType.APPLICATION_JSON)
                    .content(json("a".repeat(101))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[0].code").value("Size"));
        }

        @Test
        void addGroup_nameTakenIgnoringCase_conflict_AC_NT_06() throws Exception {
            UUID deck = draftDeck();
            data.group(deck, "Môi trường", false);

            asTeacher(teacher, post(groupsOf(deck)).contentType(MediaType.APPLICATION_JSON).content(json("môi trường")))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("VOCAB_GROUP_NAME_TAKEN"));
        }

        @Test
        void addGroup_nameOfDeletedGroup_allowed() throws Exception {
            UUID deck = draftDeck();
            data.group(deck, "Môi trường", true);

            asTeacher(teacher, post(groupsOf(deck)).contentType(MediaType.APPLICATION_JSON).content(json("Môi trường")))
                    .andExpect(status().isCreated());
        }

        @Test
        void addGroup_asAdmin_forbidden() throws Exception {
            UUID deck = draftDeck();

            as(data.admin(), Role.ADMIN, post(groupsOf(deck)).contentType(MediaType.APPLICATION_JSON)
                    .content(json("Nhóm")))
                    .andExpect(status().isForbidden());
        }
    }

    @Nested
    class RenameGroup {

        @Test
        void renameGroup_valid_keepsCards_AC_NT_08() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Môi trường", false);
            IntStream.range(0, 5).forEach(i -> data.card(group, "w" + i, false));

            asTeacher(teacher, put(groupOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content(json("Môi trường và khí hậu")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.name").value("Môi trường và khí hậu"))
                    .andExpect(jsonPath("$.data.cardCount").value(5));
        }

        @Test
        void renameGroup_publishedDeck_staysPublished_AC_NT_09() throws Exception {
            UUID deck = publishedDeck();
            UUID group = data.group(deck, "Cũ", false);
            data.card(group, "apple", false);

            asTeacher(teacher, put(groupOf(deck, group)).contentType(MediaType.APPLICATION_JSON).content(json("Mới")))
                    .andExpect(status().isOk());

            assertThat(groupNames(deck)).containsExactly("Mới");
            assertThat(jdbc.queryForObject("SELECT status FROM vocab_decks WHERE id = ?", String.class, deck))
                    .isEqualTo("published");
        }

        @Test
        void renameGroup_deckOfOtherTeacher_forbidden_AC_NT_10() throws Exception {
            UUID deck = data.deck(otherTeacher, "Bộ của B " + UUID.randomUUID()).insert();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, put(groupOf(deck, group)).contentType(MediaType.APPLICATION_JSON).content(json("X")))
                    .andExpect(status().isForbidden());
        }

        @Test
        void renameGroup_deletedGroup_notFound_AC_NT_12() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Đã xóa", true);

            asTeacher(teacher, put(groupOf(deck, group)).contentType(MediaType.APPLICATION_JSON).content(json("X")))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("VOCAB_GROUP_NOT_FOUND"));
        }

        @Test
        void renameGroup_blankName_keepsOldName_AC_NT_59() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Công việc", false);

            asTeacher(teacher, put(groupOf(deck, group)).contentType(MediaType.APPLICATION_JSON).content(json("")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
            assertThat(groupNames(deck)).containsExactly("Công việc");
        }

        @Test
        void renameGroup_nameOfOtherGroup_conflict_AC_NT_14() throws Exception {
            UUID deck = draftDeck();
            data.group(deck, "Môi trường", false);
            UUID group = data.group(deck, "Công việc", false);

            asTeacher(teacher, put(groupOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content(json("môi trường")))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("VOCAB_GROUP_NAME_TAKEN"));
            assertThat(groupNames(deck)).containsExactly("Môi trường", "Công việc");
        }

        @Test
        void renameGroup_changeCaseOfOwnName_allowed() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "công việc", false);

            asTeacher(teacher, put(groupOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content(json("Công việc")))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    class DeleteGroup {

        @Test
        void deleteGroup_softDeletesGroupAndCards_AC_NT_16() throws Exception {
            UUID deck = draftDeck();
            data.group(deck, "Công việc", false);
            UUID group = data.group(deck, "Môi trường", false);
            data.group(deck, "Du lịch", false);
            IntStream.range(0, 5).forEach(i -> data.card(group, "env" + i, false));

            asTeacher(teacher, delete(groupOf(deck, group))).andExpect(status().isNoContent());

            assertThat(groupNames(deck)).containsExactly("Công việc", "Du lịch");
            assertThat(jdbc.queryForObject(
                    "SELECT count(*) FROM vocab_cards WHERE group_id = ? AND deleted_at IS NOT NULL", Integer.class,
                    group)).isEqualTo(5);
        }

        @Test
        void deleteGroup_deckOfOtherTeacher_forbidden_AC_NT_17() throws Exception {
            UUID deck = data.deck(otherTeacher, "Bộ của B " + UUID.randomUUID()).insert();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, delete(groupOf(deck, group))).andExpect(status().isForbidden());
            assertThat(groupNames(deck)).containsExactly("Nhóm");
        }

        @Test
        void deleteGroup_alreadyDeleted_notFound_AC_NT_19() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Đã xóa", true);

            asTeacher(teacher, delete(groupOf(deck, group)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("VOCAB_GROUP_NOT_FOUND"));
        }

        @Test
        void deleteGroup_onlyGroupOfPublishedDeck_rejected_AC_NT_20() throws Exception {
            UUID deck = publishedDeck();
            UUID group = data.group(deck, "Duy nhất", false);
            data.card(group, "apple", false);

            asTeacher(teacher, delete(groupOf(deck, group)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.details.reason").value("LAST_GROUP"));
            assertThat(groupNames(deck)).containsExactly("Duy nhất");
        }

        @Test
        void deleteGroup_publishedDeckWithOtherGroups_allowed() throws Exception {
            UUID deck = publishedDeck();
            UUID first = data.group(deck, "Một", false);
            data.card(first, "apple", false);
            data.card(data.group(deck, "Hai", false), "banana", false);

            asTeacher(teacher, delete(groupOf(deck, first))).andExpect(status().isNoContent());
            assertThat(groupNames(deck)).containsExactly("Hai");
        }
    }

    // ================================================================ thẻ

    @Nested
    class AddCard {

        @Test
        void addCard_valid_appendsAtEndOfGroup_AC_NT_23() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Môi trường", false);
            IntStream.range(0, 5).forEach(i -> data.card(group, "w" + i, false));

            asTeacher(teacher, post(cardsOf(deck, group)).contentType(MediaType.APPLICATION_JSON).content("""
                    {"word":"  sustain ","meaningVi":"duy trì","ipaUk":"/səˈsteɪn/","pos":"verb",
                     "definitionEn":"to keep something going","exampleEn":"","exampleVi":null}"""))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.word").value("sustain"))
                    .andExpect(jsonPath("$.data.pos").value("verb"))
                    .andExpect(jsonPath("$.data.ipaUk").value("/səˈsteɪn/"))
                    .andExpect(jsonPath("$.data.exampleEn").isEmpty());

            assertThat(words(group)).hasSize(6).last().isEqualTo("sustain");
        }

        @Test
        void addCard_deckOfOtherTeacher_forbidden_AC_NT_25() throws Exception {
            UUID deck = data.deck(otherTeacher, "Bộ của B " + UUID.randomUUID()).insert();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, post(cardsOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("apple", "táo")))
                    .andExpect(status().isForbidden());
            assertThat(words(group)).isEmpty();
        }

        @Test
        void addCard_deletedGroup_notFound_AC_NT_27() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Đã xóa", true);

            asTeacher(teacher, post(cardsOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("apple", "táo")))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("VOCAB_GROUP_NOT_FOUND"));
        }

        @Test
        void addCard_blankWordOrMeaning_rejected_AC_NT_29() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, post(cardsOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("   ", "")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[*].field").value(containsInAnyOrder(
                            "word", "meaningVi")));
            assertThat(words(group)).isEmpty();
        }

        @Test
        void addCard_tooLongOrUnknownPos_rejected() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, post(cardsOf(deck, group)).contentType(MediaType.APPLICATION_JSON).content(
                    "{\"word\":\"apple\",\"meaningVi\":\"táo\",\"pos\":\"abbreviation\",\"ipaUs\":\""
                            + "a".repeat(101) + "\",\"definitionVi\":\"" + "b".repeat(501) + "\"}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[*].field").value(containsInAnyOrder(
                            "pos", "ipaUs", "definitionVi")));
        }

        @Test
        void addCard_wordInOtherGroupIgnoringCase_conflict_AC_NT_30() throws Exception {
            UUID deck = draftDeck();
            UUID first = data.group(deck, "Một", false);
            UUID existing = data.card(first, "Sustain", false);
            UUID second = data.group(deck, "Hai", false);

            asTeacher(teacher, post(cardsOf(deck, second)).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("sustain", "duy trì")))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.code").value("VOCAB_CARD_WORD_TAKEN"))
                    .andExpect(jsonPath("$.details.cardId").value(existing.toString()))
                    .andExpect(jsonPath("$.details.groupName").value("Một"))
                    .andExpect(jsonPath("$.details.word").value("Sustain"));
            assertThat(words(second)).isEmpty();
        }

        @Test
        void addCard_wordOfDeletedCard_allowed() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            data.card(group, "sustain", true);

            asTeacher(teacher, post(cardsOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("sustain", "duy trì")))
                    .andExpect(status().isCreated());
        }

        @Test
        void addCard_publishedDeck_allowed() throws Exception {
            UUID deck = publishedDeck();
            UUID group = data.group(deck, "Nhóm", false);
            data.card(group, "apple", false);

            asTeacher(teacher, post(cardsOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("banana", "chuối")))
                    .andExpect(status().isCreated());
            assertThat(words(group)).containsExactly("apple", "banana");
        }
    }

    @Nested
    class UpdateCard {

        @Test
        void updateCard_blankWordOrMeaning_rejectedAndCardKept_AC_NT_38() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "sustain", false);

            asTeacher(teacher, put(cardsOf(deck, group) + "/" + card).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("   ", "")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[*].field").value(containsInAnyOrder("word", "meaningVi")));
            assertThat(words(group)).containsExactly("sustain");
        }

        @Test
        void updateCard_valid_keepsPosition_AC_NT_32() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "sustain", false);
            data.card(group, "zebra", false);

            asTeacher(teacher, put(cardsOf(deck, group) + "/" + card).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("sustain", "duy trì, chống đỡ")))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.meaningVi").value("duy trì, chống đỡ"));

            assertThat(words(group)).containsExactly("sustain", "zebra");
        }

        @Test
        void updateCard_deckOfOtherTeacher_forbidden_AC_NT_34() throws Exception {
            UUID deck = data.deck(otherTeacher, "Bộ của B " + UUID.randomUUID()).insert();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "apple", false);

            asTeacher(teacher, put(cardsOf(deck, group) + "/" + card).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("apple", "quả táo")))
                    .andExpect(status().isForbidden());
        }

        @Test
        void updateCard_deletedCard_notFound_AC_NT_36() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "apple", true);

            asTeacher(teacher, put(cardsOf(deck, group) + "/" + card).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("apple", "táo")))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("VOCAB_CARD_NOT_FOUND"));
        }

        @Test
        void updateCard_wordOfOtherCard_conflict_AC_NT_39() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "sustain", false);
            data.card(group, "environment", false);

            asTeacher(teacher, put(cardsOf(deck, group) + "/" + card).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("Environment", "môi trường")))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.details.word").value("environment"));
            assertThat(words(group)).containsExactly("sustain", "environment");
        }

        @Test
        void updateCard_changeCaseOfOwnWord_allowed() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "sustain", false);

            asTeacher(teacher, put(cardsOf(deck, group) + "/" + card).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("Sustain", "duy trì")))
                    .andExpect(status().isOk());
        }
    }

    @Nested
    class DeleteCard {

        @Test
        void deleteCard_valid_softDeletes_AC_NT_41() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "sustain", false);
            data.card(group, "apple", false);

            asTeacher(teacher, delete(cardsOf(deck, group) + "/" + card)).andExpect(status().isNoContent());

            assertThat(words(group)).containsExactly("apple");
            assertThat(jdbc.queryForObject("SELECT deleted_at IS NOT NULL FROM vocab_cards WHERE id = ?",
                    Boolean.class, card)).isTrue();
        }

        @Test
        void deleteCard_deckOfOtherTeacher_forbidden_AC_NT_42() throws Exception {
            UUID deck = data.deck(otherTeacher, "Bộ của B " + UUID.randomUUID()).insert();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "apple", false);

            asTeacher(teacher, delete(cardsOf(deck, group) + "/" + card)).andExpect(status().isForbidden());
            assertThat(words(group)).containsExactly("apple");
        }

        @Test
        void deleteCard_deletedCard_notFound_AC_NT_44() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "apple", true);

            asTeacher(teacher, delete(cardsOf(deck, group) + "/" + card))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("VOCAB_CARD_NOT_FOUND"));
        }

        @Test
        void deleteCard_lastCardOfGroupInPublishedDeck_rejected_AC_NT_45() throws Exception {
            UUID deck = publishedDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "apple", false);

            asTeacher(teacher, delete(cardsOf(deck, group) + "/" + card))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.details.reason").value("LAST_CARD"));
            assertThat(words(group)).containsExactly("apple");
        }

        @Test
        void deleteCard_lastCardOfDraftDeck_allowed() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "apple", false);

            asTeacher(teacher, delete(cardsOf(deck, group) + "/" + card)).andExpect(status().isNoContent());
            assertThat(words(group)).isEmpty();
        }
    }

    // ================================================================ ảnh thẻ (BR-NT-03, UC-NT-08)

    @Nested
    class CardImage {

        private static final byte[] JPG_HEAD = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0, 0, 0};
        private static final byte[] PDF_HEAD = "%PDF-1.7".getBytes(StandardCharsets.US_ASCII);
        private static final String CDN = "https://cdn.test/";

        @BeforeEach
        void stubStorage() {
            when(storage.readHead(anyString(), anyInt())).thenReturn(JPG_HEAD);
            when(storage.publicUrl(anyString())).thenAnswer(inv -> CDN + inv.getArgument(0));
        }

        private String keyOf(UUID owner) {
            return "vocab-decks/cards/" + owner + "/" + UUID.randomUUID() + ".jpg";
        }

        private String imageOf(UUID card) {
            return jdbc.queryForObject("SELECT image_url FROM vocab_cards WHERE id = ?", String.class, card);
        }

        private void setImage(UUID card, String key) {
            jdbc.update("UPDATE vocab_cards SET image_url = ? WHERE id = ?", key, card);
        }

        private static String cardWithImage(String word, String imageKey) {
            return "{\"word\":\"" + word + "\",\"meaningVi\":\"nghĩa\",\"imageKey\":\"" + imageKey + "\"}";
        }

        @Test
        void addCard_withImage_storesKeyAndReturnsPublicUrl_AC_NT_73() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            String key = keyOf(teacher);

            asTeacher(teacher, post(cardsOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content(cardWithImage("sustain", key)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.imageUrl").value(CDN + key));

            assertThat(jdbc.queryForObject("SELECT image_url FROM vocab_cards WHERE group_id = ?", String.class, group))
                    .isEqualTo(key);
            verify(storage).confirmUpload(teacher, UploadPurpose.CARD_IMAGE, key);
        }

        @Test
        void addCard_imageNotJpgOrPng_rejectedOnImageFieldAndDiscarded_AC_NT_74() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            String key = keyOf(teacher);
            when(storage.readHead(eq(key), anyInt())).thenReturn(PDF_HEAD);

            asTeacher(teacher, post(cardsOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content(cardWithImage("sustain", key)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[0].field").value("image"))
                    .andExpect(jsonPath("$.errors[0].code").value("ImageType"));

            assertThat(words(group)).isEmpty();
            verify(storage).discardUpload(teacher, UploadPurpose.CARD_IMAGE, key);
        }

        @Test
        void updateCard_newImageNotJpgOrPng_keepsOldImage_AC_NT_76() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "sustain", false);
            String oldKey = keyOf(teacher);
            setImage(card, oldKey);
            String badKey = keyOf(teacher);
            when(storage.readHead(eq(badKey), anyInt())).thenReturn(PDF_HEAD);

            asTeacher(teacher, put(cardsOf(deck, group) + "/" + card).contentType(MediaType.APPLICATION_JSON)
                    .content(cardWithImage("sustain", badKey)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[0].field").value("image"));

            assertThat(imageOf(card)).isEqualTo(oldKey);
            verify(storage).discardUpload(teacher, UploadPurpose.CARD_IMAGE, badKey);
            verify(storage, never()).discardUpload(teacher, UploadPurpose.CARD_IMAGE, oldKey);
        }

        @Test
        void attachImages_groupWithoutCards_attachesNothing_AC_NT_72() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm trống", false);
            String key = keyOf(teacher);

            asTeacher(teacher, post(cardsOf(deck, group) + "/images").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"items\":[{\"fileName\":\"sustain.jpg\",\"imageKey\":\"" + key + "\"}]}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.attached").isEmpty())
                    .andExpect(jsonPath("$.data.unmatched").value(contains("sustain.jpg")));
            verify(storage).discardUpload(teacher, UploadPurpose.CARD_IMAGE, key);
        }

        @Test
        void updateCard_newImage_replacesAndDiscardsOldImage_AC_NT_75() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "sustain", false);
            String oldKey = keyOf(teacher);
            setImage(card, oldKey);
            String newKey = keyOf(teacher);

            asTeacher(teacher, put(cardsOf(deck, group) + "/" + card).contentType(MediaType.APPLICATION_JSON)
                    .content(cardWithImage("sustain", newKey)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.imageUrl").value(CDN + newKey));

            assertThat(imageOf(card)).isEqualTo(newKey);
            verify(storage).discardUpload(teacher, UploadPurpose.CARD_IMAGE, oldKey);
        }

        @Test
        void updateCard_withoutImageFields_keepsImage() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "sustain", false);
            String key = keyOf(teacher);
            setImage(card, key);

            asTeacher(teacher, put(cardsOf(deck, group) + "/" + card).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("sustain", "duy trì")))
                    .andExpect(status().isOk());

            assertThat(imageOf(card)).isEqualTo(key);
            verify(storage, never()).discardUpload(any(), any(), anyString());
        }

        @Test
        void updateCard_removeImage_clearsAndDiscards_AC_NT_75() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "sustain", false);
            String key = keyOf(teacher);
            setImage(card, key);

            asTeacher(teacher, put(cardsOf(deck, group) + "/" + card).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"word\":\"sustain\",\"meaningVi\":\"duy trì\",\"removeImage\":true}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.imageUrl").isEmpty());

            assertThat(imageOf(card)).isNull();
            verify(storage).discardUpload(teacher, UploadPurpose.CARD_IMAGE, key);
        }

        @Test
        void attachImages_matchesFileNamesToWords_AC_NT_64() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID sustain = data.card(group, "sustain", false);
            UUID phrasal = data.card(group, "phrasal verb", false);
            UUID apple = data.card(group, "apple", false);
            String oldApple = keyOf(teacher);
            setImage(apple, oldApple);
            String k1 = keyOf(teacher);
            String k2 = keyOf(teacher);
            String k3 = keyOf(teacher);
            String unknown = keyOf(teacher);
            String duplicate = keyOf(teacher);
            String bad = keyOf(teacher);
            when(storage.readHead(eq(bad), anyInt())).thenReturn(PDF_HEAD);

            asTeacher(teacher, post(cardsOf(deck, group) + "/images").contentType(MediaType.APPLICATION_JSON).content(
                    "{\"items\":["
                            + "{\"fileName\":\"Sustain.JPG\",\"imageKey\":\"" + k1 + "\"},"
                            + "{\"fileName\":\"phrasal_verb.png\",\"imageKey\":\"" + k2 + "\"},"
                            + "{\"fileName\":\"apple.jpg\",\"imageKey\":\"" + k3 + "\"},"
                            + "{\"fileName\":\"banana.jpg\",\"imageKey\":\"" + unknown + "\"},"
                            + "{\"fileName\":\"sustain.png\",\"imageKey\":\"" + duplicate + "\"},"
                            + "{\"fileName\":\"zebra.png\",\"imageKey\":\"" + bad + "\"}]}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.attached[*].word").value(contains("sustain", "phrasal verb", "apple")))
                    .andExpect(jsonPath("$.data.unmatched").value(containsInAnyOrder("banana.jpg", "zebra.png")))
                    .andExpect(jsonPath("$.data.duplicated").value(contains("sustain.png")))
                    .andExpect(jsonPath("$.data.invalid").isEmpty());

            assertThat(imageOf(sustain)).isEqualTo(k1);
            assertThat(imageOf(phrasal)).isEqualTo(k2);
            assertThat(imageOf(apple)).isEqualTo(k3);
            verify(storage).discardUpload(teacher, UploadPurpose.CARD_IMAGE, oldApple);
            verify(storage).discardUpload(teacher, UploadPurpose.CARD_IMAGE, unknown);
            verify(storage).discardUpload(teacher, UploadPurpose.CARD_IMAGE, duplicate);
        }

        @Test
        void attachImages_notJpgOrPng_reportedInvalid_AC_NT_65() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "sustain", false);
            String bad = keyOf(teacher);
            when(storage.readHead(eq(bad), anyInt())).thenReturn(PDF_HEAD);

            asTeacher(teacher, post(cardsOf(deck, group) + "/images").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"items\":[{\"fileName\":\"sustain.png\",\"imageKey\":\"" + bad + "\"}]}"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.attached").isEmpty())
                    .andExpect(jsonPath("$.data.invalid").value(contains("sustain.png")));

            assertThat(imageOf(card)).isNull();
            verify(storage).discardUpload(teacher, UploadPurpose.CARD_IMAGE, bad);
        }

        @Test
        void attachImages_deckOfOtherTeacher_forbidden_AC_NT_66() throws Exception {
            UUID deck = data.deck(otherTeacher, "Bộ của B " + UUID.randomUUID()).insert();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "sustain", false);

            asTeacher(teacher, post(cardsOf(deck, group) + "/images").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"items\":[{\"fileName\":\"sustain.png\",\"imageKey\":\"" + keyOf(teacher)
                            + "\"}]}"))
                    .andExpect(status().isForbidden());

            assertThat(imageOf(card)).isNull();
        }

        @Test
        void attachImages_over100Items_rejected() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            String items = IntStream.range(0, 101)
                    .mapToObj(i -> "{\"fileName\":\"w" + i + ".png\",\"imageKey\":\"k" + i + "\"}")
                    .collect(Collectors.joining(","));

            asTeacher(teacher, post(cardsOf(deck, group) + "/images").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"items\":[" + items + "]}"))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors[0].field").value("items"));
        }

        @Test
        void listCards_returnsImageUrl() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, "sustain", false);
            String key = keyOf(teacher);
            setImage(card, key);

            asTeacher(teacher, get(cardsOf(deck, group)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.items[0].imageUrl").value(CDN + key));
        }
    }

    // ================================================================ âm thanh từ từ điển (BR-NT-08)

    @Nested
    class CardAudio {

        @Test
        void addCard_wordInDictionary_copiesAudioOfMatchingPos() throws Exception {
            String word = dictionaryWord();
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, post(cardsOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"word\":\"" + word.toUpperCase() + "\",\"meaningVi\":\"ghi lại\",\"pos\":\"verb\"}"))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.audioUk", endsWith("audio/v-uk.mp3")))
                    .andExpect(jsonPath("$.data.audioUs", endsWith("audio/v-us.mp3")));

            assertThat(audioOf(group, word.toUpperCase())).containsExactly("audio/v-uk.mp3", "audio/v-us.mp3");
        }

        @Test
        void addCard_wordNotInDictionary_hasNoAudio() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, post(cardsOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("zzqxnotaword", "không có")))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.audioUs").value(nullValue()));

            assertThat(audioOf(group, "zzqxnotaword")).containsExactly(null, null);
        }

        @Test
        void updateCard_changePos_recomputesAudio() throws Exception {
            String word = dictionaryWord();
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);
            UUID card = data.card(group, word, false);

            asTeacher(teacher, put(cardsOf(deck, group) + "/" + card).contentType(MediaType.APPLICATION_JSON)
                    .content("{\"word\":\"" + word + "\",\"meaningVi\":\"hồ sơ\",\"pos\":\"noun\"}"))
                    .andExpect(status().isOk());

            assertThat(audioOf(group, word)).containsExactly("audio/n-uk.mp3", "audio/n-us.mp3");
        }

        @Test
        void importCards_copiesAudioForDictionaryWords() throws Exception {
            String word = dictionaryWord();
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, multipart(cardsOf(deck, group) + "/import").file(new MockMultipartFile("file", "the.csv",
                    "text/csv", (HEADER + "\n" + word + ",hồ sơ\nzzqxother,khác").getBytes(StandardCharsets.UTF_8))))
                    .andExpect(status().isCreated());

            assertThat(audioOf(group, word)).containsExactly("audio/n-uk.mp3", "audio/n-us.mp3");
            assertThat(audioOf(group, "zzqxother")).containsExactly(null, null);
        }
    }

    // ================================================================ nhập từ tệp (UC-NT-07)

    @Nested
    class ImportCards {

        private MockMultipartFile csv(String body) {
            return new MockMultipartFile("file", "the.csv", "text/csv", body.getBytes(StandardCharsets.UTF_8));
        }

        private String rows(int count, String prefix) {
            return IntStream.range(0, count)
                    .mapToObj(i -> prefix + i + ",nghĩa " + i + ",,,danh từ,,,,")
                    .collect(Collectors.joining("\n"));
        }

        @Test
        void import_validCsv_previewThenAppendInFileOrder_AC_NT_48() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Môi trường", false);
            IntStream.range(0, 5).forEach(i -> data.card(group, "old" + i, false));
            MockMultipartFile file = csv(HEADER + "\n" + rows(20, "new"));

            asTeacher(teacher, multipart(cardsOf(deck, group) + "/import/preview").file(file))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.cardCount").value(20));
            assertThat(words(group)).hasSize(5);

            asTeacher(teacher, multipart(cardsOf(deck, group) + "/import").file(file))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.addedCount").value(20));

            List<String> words = words(group);
            assertThat(words).hasSize(25);
            assertThat(words.subList(5, 25))
                    .containsExactlyElementsOf(IntStream.range(0, 20).mapToObj(i -> "new" + i).toList());
            assertThat(jdbc.queryForList("SELECT DISTINCT pos FROM vocab_cards WHERE group_id = ? AND word LIKE 'new%'",
                    String.class, group)).containsExactly("noun");
        }

        @Test
        void import_validXlsx_appendsCards_AC_NT_48() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, multipart(cardsOf(deck, group) + "/import").file(new MockMultipartFile("file",
                    "the.xlsx", "application/octet-stream", xlsx(List.of(
                            List.of("Từ vựng", "Nghĩa tiếng Việt", "Loại từ"),
                            List.of("sustain", "duy trì", "verb"),
                            List.of("environment", "môi trường", "Danh từ"))))))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.data.addedCount").value(2));

            assertThat(words(group)).containsExactly("sustain", "environment");
        }

        @Test
        void template_xlsxAndCsv_haveAllColumnsAndExampleRow_AC_NT_49() throws Exception {
            byte[] xlsx = asTeacher(teacher, get(DECKS + "card-import-template"))
                    .andExpect(status().isOk())
                    .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                            containsString("mau-nhap-the.xlsx")))
                    .andReturn().getResponse().getContentAsByteArray();
            try (XSSFWorkbook workbook = new XSSFWorkbook(new ByteArrayInputStream(xlsx))) {
                Sheet sheet = workbook.getSheetAt(0);
                assertThat(sheet.getRow(0).getCell(0).getStringCellValue()).isEqualTo("Từ vựng");
                assertThat(sheet.getRow(0).getLastCellNum()).isEqualTo((short) 9);
                assertThat(sheet.getRow(1).getCell(0).getStringCellValue()).isEqualTo("sustain");
            }

            String csv = asTeacher(teacher, get(DECKS + "card-import-template").param("format", "csv"))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
            assertThat(csv).startsWith((char) 0xFEFF + HEADER).contains("sustain,duy trì");
        }

        @Test
        void import_deckOfOtherTeacher_forbidden_AC_NT_50() throws Exception {
            UUID deck = data.deck(otherTeacher, "Bộ của B " + UUID.randomUUID()).insert();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, multipart(cardsOf(deck, group) + "/import/preview")
                    .file(csv(HEADER + "\napple,táo")))
                    .andExpect(status().isForbidden());
        }

        @Test
        void import_deletedGroup_notFound_AC_NT_52() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Đã xóa", true);

            asTeacher(teacher, multipart(cardsOf(deck, group) + "/import").file(csv(HEADER + "\napple,táo")))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("VOCAB_GROUP_NOT_FOUND"));
        }

        @Test
        void import_pdfFile_rejectedAsFormat_AC_NT_53() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, multipart(cardsOf(deck, group) + "/import/preview").file(new MockMultipartFile("file",
                    "the.pdf", "application/pdf", "%PDF-1.7".getBytes(StandardCharsets.US_ASCII))))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.code").value("VOCAB_IMPORT_FILE_INVALID"))
                    .andExpect(jsonPath("$.details.reason").value("FORMAT"));
        }

        @Test
        void import_fileOver2MB_rejectedAsTooLarge_AC_NT_53() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, multipart(cardsOf(deck, group) + "/import/preview").file(new MockMultipartFile("file",
                    "the.xlsx", "application/octet-stream", new byte[2 * 1024 * 1024 + 1])))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.details.reason").value("TOO_LARGE"));
        }

        @Test
        void import_csvMissingWordColumn_rejected_AC_NT_53() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, multipart(cardsOf(deck, group) + "/import/preview")
                    .file(csv("Nghĩa tiếng Việt,Loại từ\ntáo,danh từ")))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.details.reason").value("MISSING_COLUMNS"))
                    .andExpect(jsonPath("$.details.missingColumns").value(contains("Từ vựng")));
        }

        @Test
        void import_rowsWithErrors_reportsEachRowAndAddsNothing_AC_NT_54() throws Exception {
            UUID deck = draftDeck();
            data.card(data.group(deck, "Khác", false), "Sustain", false);
            UUID group = data.group(deck, "Nhóm", false);
            // dòng 1 là tên cột: dòng 5 thiếu nghĩa, dòng 9 trùng từ đã có trong bộ, dòng 10 trùng dòng 2
            String body = HEADER + "\n" + String.join("\n",
                    "a1,n", "a2,n", "a3,n", "a4,", "a5,n", "a6,n", "a7,n", "sustain,duy trì", "A1,n");

            asTeacher(teacher, multipart(cardsOf(deck, group) + "/import").file(csv(body)))
                    .andExpect(status().isUnprocessableContent())
                    .andExpect(jsonPath("$.code").value("VOCAB_IMPORT_ROWS_INVALID"))
                    .andExpect(jsonPath("$.details.errors[0].row").value(5))
                    .andExpect(jsonPath("$.details.errors[0].field").value("meaningVi"))
                    .andExpect(jsonPath("$.details.errors[0].code").value("NotBlank"))
                    .andExpect(jsonPath("$.details.errors[1].row").value(9))
                    .andExpect(jsonPath("$.details.errors[1].code").value("DuplicateInDeck"))
                    .andExpect(jsonPath("$.details.errors[2].row").value(10))
                    .andExpect(jsonPath("$.details.errors[2].code").value("DuplicateInFile"))
                    .andExpect(jsonPath("$.details.errors[2].otherRow").value(2));
            assertThat(words(group)).isEmpty();
        }

        @Test
        void import_unknownPos_reportsRow() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, multipart(cardsOf(deck, group) + "/import/preview")
                    .file(csv(HEADER + "\nUN,Liên Hợp Quốc,,,viết tắt,,,,")))
                    .andExpect(status().isUnprocessableContent())
                    .andExpect(jsonPath("$.details.errors[*].field").value(hasItem("pos")));
        }

        @Test
        void import_501Rows_rejected_AC_NT_55() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, multipart(cardsOf(deck, group) + "/import").file(csv(HEADER + "\n" + rows(501, "w"))))
                    .andExpect(status().isUnprocessableContent())
                    .andExpect(jsonPath("$.code").value("VOCAB_IMPORT_TOO_MANY_ROWS"))
                    .andExpect(jsonPath("$.details.max").value(500));
            assertThat(words(group)).isEmpty();
        }

        @Test
        void import_500Rows_accepted() throws Exception {
            UUID deck = draftDeck();
            UUID group = data.group(deck, "Nhóm", false);

            asTeacher(teacher, multipart(cardsOf(deck, group) + "/import/preview")
                    .file(csv(HEADER + "\n" + rows(500, "w"))))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.cardCount").value(500));
        }

        private byte[] xlsx(List<List<String>> table) throws Exception {
            try (XSSFWorkbook workbook = new XSSFWorkbook(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
                Sheet sheet = workbook.createSheet();
                for (int r = 0; r < table.size(); r++) {
                    Row row = sheet.createRow(r);
                    for (int c = 0; c < table.get(r).size(); c++) {
                        row.createCell(c).setCellValue(table.get(r).get(c));
                    }
                }
                workbook.write(out);
                return out.toByteArray();
            }
        }
    }

    // ================================================================ bộ hoặc nhóm không còn

    /** Bộ bị xóa (hoặc nhóm bị xóa) trong lúc giáo viên đang xem trang cũ: mọi thao tác báo không tìm thấy, không ghi gì. */
    @Nested
    class GoneTargets {

        private UUID deck;
        private UUID group;
        private UUID card;

        @BeforeEach
        void deletedDeckWithContent() {
            deck = data.deck(teacher, "Bộ vừa xóa " + UUID.randomUUID()).insert();
            group = data.group(deck, "Nhóm", false);
            card = data.card(group, "sustain", false);
            jdbc.update("UPDATE vocab_decks SET deleted_at = now() WHERE id = ?", deck);
        }

        private void expectDeckNotFound(ResultActions result) throws Exception {
            result.andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("VOCAB_DECK_NOT_FOUND"));
        }

        @Test
        void renameGroup_deletedDeck_notFound_AC_NT_11() throws Exception {
            expectDeckNotFound(asTeacher(teacher, put(groupOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content(json("Tên mới"))));
            assertThat(groupNames(deck)).containsExactly("Nhóm");
        }

        @Test
        void deleteGroup_deletedDeck_notFound_AC_NT_18() throws Exception {
            expectDeckNotFound(asTeacher(teacher, delete(groupOf(deck, group))));
            assertThat(groupNames(deck)).containsExactly("Nhóm");
        }

        @Test
        void addCard_deletedDeck_notFound_AC_NT_26() throws Exception {
            expectDeckNotFound(asTeacher(teacher, post(cardsOf(deck, group)).contentType(MediaType.APPLICATION_JSON)
                    .content(cardJson("apple", "táo"))));
            assertThat(words(group)).containsExactly("sustain");
        }

        @Test
        void updateCard_deletedDeck_notFound_AC_NT_35() throws Exception {
            expectDeckNotFound(asTeacher(teacher, put(cardsOf(deck, group) + "/" + card)
                    .contentType(MediaType.APPLICATION_JSON).content(cardJson("sustained", "được duy trì"))));
            assertThat(words(group)).containsExactly("sustain");
        }

        @Test
        void deleteCard_deletedDeck_notFound_AC_NT_43() throws Exception {
            expectDeckNotFound(asTeacher(teacher, delete(cardsOf(deck, group) + "/" + card)));
            assertThat(words(group)).containsExactly("sustain");
        }

        @Test
        void importCards_deletedDeck_notFound_AC_NT_51() throws Exception {
            MockMultipartFile file = new MockMultipartFile("file", "the.csv", "text/csv",
                    "Từ vựng,Nghĩa tiếng Việt\napple,táo".getBytes(StandardCharsets.UTF_8));
            expectDeckNotFound(asTeacher(teacher, multipart(cardsOf(deck, group) + "/import").file(file)));
            assertThat(words(group)).containsExactly("sustain");
        }

        @Test
        void attachImages_deletedDeck_notFound_AC_NT_70() throws Exception {
            expectDeckNotFound(asTeacher(teacher, post(cardsOf(deck, group) + "/images")
                    .contentType(MediaType.APPLICATION_JSON).content(attachJson("sustain.jpg"))));
        }

        @Test
        void attachImages_deletedGroup_notFound_AC_NT_71() throws Exception {
            UUID liveDeck = draftDeck();
            UUID goneGroup = data.group(liveDeck, "Đã xóa", true);

            asTeacher(teacher, post(cardsOf(liveDeck, goneGroup) + "/images").contentType(MediaType.APPLICATION_JSON)
                    .content(attachJson("sustain.jpg")))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.code").value("VOCAB_GROUP_NOT_FOUND"));
        }

        private String attachJson(String fileName) {
            String key = "vocab-decks/cards/" + teacher + "/" + UUID.randomUUID() + ".jpg";
            return "{\"items\":[{\"fileName\":\"" + fileName + "\",\"imageKey\":\"" + key + "\"}]}";
        }
    }
}
