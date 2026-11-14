package com.lingualoop.backend.vocab.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.storage.dto.StoredObject;
import com.lingualoop.backend.storage.service.FileStorageService;
import com.lingualoop.backend.storage.service.UploadPurpose;
import com.lingualoop.backend.vocab.DeckManageTestData;

/**
 * API sửa, xem chi tiết, xuất bản, gỡ xuất bản, xóa và khôi phục bộ thẻ (UC-BT-03 đến UC-BT-08) trên Postgres thật. Kho
 * tệp S3 được thay bằng mock: ảnh coi như đã tải lên và là JPG.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DeckManageTestData.class})
class VocabDeckLifecycleApiIntegrationTest {

    private static final String TEACHER = "/api/v1/teacher/vocab/decks";
    private static final String ADMIN = "/api/v1/admin/vocab/decks";
    private static final byte[] JPG_HEAD = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0, 0, 0};

    @Autowired private MockMvc mockMvc;
    @Autowired private DeckManageTestData data;
    @Autowired private JdbcTemplate jdbc;
    @MockitoBean private FileStorageService storage;

    private UUID teacherA;
    private UUID teacherB;
    private UUID admin;

    @BeforeEach
    void setUp() {
        teacherA = data.teacher("GV A");
        teacherB = data.teacher("GV B");
        admin = data.admin();
        when(storage.confirmUpload(any(), any(), anyString()))
                .thenAnswer(inv -> new StoredObject(inv.getArgument(2), "image/jpeg", 500 * 1024));
        when(storage.readHead(anyString(), anyInt())).thenReturn(JPG_HEAD);
        when(storage.publicUrl(anyString())).thenAnswer(inv -> "https://cdn.test/" + inv.getArgument(0));
    }

    private ResultActions as(UUID user, Role role, AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user, role)));
    }

    private ResultActions asA(AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return as(teacherA, Role.TEACHER, request);
    }

    private ResultActions asAdmin(AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return as(admin, Role.ADMIN, request);
    }

    private static AbstractMockHttpServletRequestBuilder<?> json(AbstractMockHttpServletRequestBuilder<?> request,
            String body) {
        return request.contentType(MediaType.APPLICATION_JSON).content(body);
    }

    /** Bộ có {@code groups} nhóm, mỗi nhóm một thẻ. */
    private UUID deckWithCards(UUID owner, String name, int groups, boolean published) {
        DeckManageTestData.DeckBuilder builder = data.deck(owner, name);
        UUID deck = (published ? builder.published() : builder).insert();
        for (int i = 1; i <= groups; i++) {
            data.card(data.group(deck, "Nhóm " + i, false), "word" + i, false);
        }
        return deck;
    }

    private String statusOf(UUID deck) {
        return jdbc.queryForObject("SELECT status FROM vocab_decks WHERE id = ?", String.class, deck);
    }

    private Instant deletedAtOf(UUID deck) {
        java.sql.Timestamp at = jdbc.queryForObject("SELECT deleted_at FROM vocab_decks WHERE id = ?",
                java.sql.Timestamp.class, deck);
        return at == null ? null : at.toInstant();
    }

    // ---------------------------------------------------------------- sửa (UC-BT-03)

    @Test
    void updateDeck_draft_savesInfoAndKeepsStatus_AC_BT_14() throws Exception {
        UUID category = data.category("Công việc " + UUID.randomUUID());
        UUID deck = data.deck(teacherA, "TOEIC 1").updatedAt(Instant.now().minus(3, ChronoUnit.DAYS)).insert();
        String key = "vocab-decks/" + teacherA + "/new.jpg";

        asA(json(put(TEACHER + "/" + deck), """
                {"name":"  TOEIC 2 ","categoryId":"%s","pro":true,"imageKey":"%s"}""".formatted(category, key)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("TOEIC 2"))
                .andExpect(jsonPath("$.data.categoryId").value(category.toString()))
                .andExpect(jsonPath("$.data.imageUrl").value("https://cdn.test/" + key))
                .andExpect(jsonPath("$.data.pro").value(true))
                .andExpect(jsonPath("$.data.status").value("draft"));
        Instant updatedAt = jdbc.queryForObject("SELECT updated_at FROM vocab_decks WHERE id = ?",
                java.sql.Timestamp.class, deck).toInstant();
        assertThat(updatedAt).isAfter(Instant.now().minus(1, ChronoUnit.MINUTES));
    }

    @Test
    void updateDeck_published_staysPublished_AC_BT_15() throws Exception {
        UUID deck = deckWithCards(teacherA, "Bộ XB", 1, true);
        asA(json(put(TEACHER + "/" + deck), "{\"name\":\"Bộ XB mới\",\"pro\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.status").value("published"));
        assertThat(statusOf(deck)).isEqualTo("published");
    }

    @Test
    void updateDeck_removeImage_dropsOldImage_AC_BT_16() throws Exception {
        String oldKey = "vocab-decks/" + teacherA + "/old.jpg";
        UUID deck = data.deck(teacherA, "Có ảnh").image(oldKey).insert();
        asA(json(put(TEACHER + "/" + deck), "{\"name\":\"Có ảnh\",\"removeImage\":true}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.imageUrl").isEmpty());
        verify(storage).discardUpload(teacherA, UploadPurpose.DECK_IMAGE, oldKey);
    }

    @Test
    void updateDeck_otherTeachersDeck_returns403_AC_BT_17() throws Exception {
        UUID deck = data.deck(teacherB, "Của B").insert();
        asA(json(put(TEACHER + "/" + deck), "{\"name\":\"Đổi\"}")).andExpect(status().isForbidden());
    }

    @Test
    void updateDeck_deletedDeck_returns404_AC_BT_18() throws Exception {
        UUID deck = data.deck(teacherA, "Đã xóa").deletedAt(Instant.now()).insert();
        asA(json(put(TEACHER + "/" + deck), "{\"name\":\"Đổi\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("VOCAB_DECK_NOT_FOUND"));
    }

    @Test
    void updateDeck_blankNameOrDuplicate_rejected_AC_BT_19_AC_BT_20() throws Exception {
        data.deck(teacherA, "TOEIC 1").insert();
        UUID ielts = data.deck(teacherA, "IELTS 1").insert();
        asA(json(put(TEACHER + "/" + ielts), "{\"name\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"));
        asA(json(put(TEACHER + "/" + ielts), "{\"name\":\"toeic 1\"}")).andExpect(status().isConflict());
        // giữ tên cũ của chính bộ thì không tính trùng
        asA(json(put(TEACHER + "/" + ielts), "{\"name\":\"IELTS 1\"}")).andExpect(status().isOk());
    }

    @Test
    void updateDeck_adminCannotEdit_returns403_AC_BT_63() throws Exception {
        UUID deck = data.deck(teacherA, "Bộ").published().insert();
        asAdmin(json(put(TEACHER + "/" + deck), "{\"name\":\"Đổi\"}")).andExpect(status().isForbidden());
        asAdmin(delete(TEACHER + "/" + deck)).andExpect(status().isForbidden());
        asAdmin(post(TEACHER + "/" + deck + "/restore")).andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- xem chi tiết (UC-BT-04)

    @Test
    void detail_teacherDraft_returnsGroupsAndCards_AC_BT_22() throws Exception {
        UUID deck = data.deck(teacherA, "Bộ nháp").insert();
        UUID g1 = data.group(deck, "Nhóm 1", false);
        data.group(deck, "Nhóm 2", false);
        data.group(deck, "Nhóm xóa", true);
        data.card(g1, "apple", false);
        data.card(g1, "banana", false);
        data.card(g1, "gone", true);

        asA(get(TEACHER + "/" + deck)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value("Bộ nháp"))
                .andExpect(jsonPath("$.data.groups[*].name").value(contains("Nhóm 1", "Nhóm 2")))
                .andExpect(jsonPath("$.data.groups[0].cardCount").value(2))
                .andExpect(jsonPath("$.data.groups[1].cardCount").value(0));
        asA(get(TEACHER + "/" + deck + "/groups/" + g1 + "/cards")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[*].word").value(contains("apple", "banana")))
                .andExpect(jsonPath("$.data.size").value(20));
    }

    @Test
    void detail_otherTeachersDeck_returns403_AC_BT_24() throws Exception {
        UUID deck = data.deck(teacherB, "Của B").insert();
        asA(get(TEACHER + "/" + deck)).andExpect(status().isForbidden());
    }

    @Test
    void detail_adminPublished_showsOwner_AC_BT_51() throws Exception {
        UUID deck = deckWithCards(teacherA, "Bộ XB", 2, true);
        asAdmin(get(ADMIN + "/" + deck)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.ownerName").value("GV A"))
                .andExpect(jsonPath("$.data.groups.length()").value(2));
    }

    @Test
    void detail_adminDraftOrDeleted_rejected_AC_BT_52_AC_BT_55() throws Exception {
        UUID draft = data.deck(teacherA, "Nháp").insert();
        UUID deleted = data.deck(teacherA, "Xóa").published().deletedAt(Instant.now()).insert();
        asAdmin(get(ADMIN + "/" + draft)).andExpect(status().isForbidden());
        asAdmin(get(ADMIN + "/" + deleted)).andExpect(status().isNotFound());
    }

    @Test
    void cards_searchAndPaging_AC_BT_53_AC_BT_54() throws Exception {
        UUID deck = data.deck(teacherA, "Môi trường").insert();
        UUID group = data.group(deck, "Môi trường", false);
        for (int i = 0; i < 45; i++) {
            data.card(group, i == 30 ? "Sustain" : "w" + i, false);
        }
        String cards = TEACHER + "/" + deck + "/groups/" + group + "/cards";
        asA(get(cards)).andExpect(jsonPath("$.data.items.length()").value(20))
                .andExpect(jsonPath("$.data.totalPages").value(3));
        asA(get(cards).param("page", "2")).andExpect(jsonPath("$.data.items.length()").value(5));
        asA(get(cards).param("q", "sustain")).andExpect(jsonPath("$.data.items[*].word").value(contains("Sustain")));
        asA(get(cards).param("q", "xyz123")).andExpect(jsonPath("$.data.totalElements").value(0));
    }

    // ---------------------------------------------------------------- xuất bản (UC-BT-05)

    @Test
    void publish_eligibleDraft_becomesPublishedAndClearsReason_AC_BT_26_AC_BT_27() throws Exception {
        UUID deck = deckWithCards(teacherA, "Đủ điều kiện", 2, false);
        jdbc.update("UPDATE vocab_decks SET unpublish_reason = 'cũ' WHERE id = ?", deck);
        asA(post(TEACHER + "/" + deck + "/publish")).andExpect(status().isNoContent());
        assertThat(statusOf(deck)).isEqualTo("published");
        assertThat(jdbc.queryForObject("SELECT unpublish_reason FROM vocab_decks WHERE id = ?", String.class, deck))
                .isNull();
    }

    @Test
    void publish_alreadyPublished_returns409_AC_BT_28() throws Exception {
        UUID deck = deckWithCards(teacherA, "XB rồi", 1, true);
        asA(post(TEACHER + "/" + deck + "/publish"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VOCAB_DECK_ALREADY_PUBLISHED"));
    }

    @Test
    void publish_emptyGroup_returns422WithGroupNames_AC_BT_29() throws Exception {
        UUID deck = deckWithCards(teacherA, "Thiếu thẻ", 1, false);
        data.group(deck, "Nhóm trống", false);
        asA(post(TEACHER + "/" + deck + "/publish"))
                .andExpect(status().isUnprocessableContent())
                .andExpect(jsonPath("$.code").value("VOCAB_DECK_NOT_PUBLISHABLE"))
                .andExpect(jsonPath("$.details.noGroups").value(false))
                .andExpect(jsonPath("$.details.emptyGroups").value(contains("Nhóm trống")));
        UUID noGroups = data.deck(teacherA, "Không nhóm").insert();
        asA(post(TEACHER + "/" + noGroups + "/publish"))
                .andExpect(jsonPath("$.details.noGroups").value(true));
        assertThat(statusOf(deck)).isEqualTo("draft");
    }

    // ---------------------------------------------------------------- gỡ xuất bản (UC-BT-06)

    @Test
    void unpublish_teacherOwnDeck_becomesDraft_AC_BT_32() throws Exception {
        UUID deck = deckWithCards(teacherA, "Gỡ", 1, true);
        asA(post(TEACHER + "/" + deck + "/unpublish")).andExpect(status().isNoContent());
        assertThat(statusOf(deck)).isEqualTo("draft");
    }

    @Test
    void unpublish_adminWithReason_reasonShownToOwner_AC_BT_33() throws Exception {
        UUID deck = deckWithCards(teacherA, "Quảng cáo", 1, true);
        asAdmin(json(post(ADMIN + "/" + deck + "/unpublish"), "{\"reason\":\"Chứa nội dung quảng cáo\"}"))
                .andExpect(status().isNoContent());
        asA(get(TEACHER)).andExpect(jsonPath("$.data.items[?(@.id=='" + deck + "')].unpublishReason")
                .value(contains("Chứa nội dung quảng cáo")));
        asA(get(TEACHER + "/" + deck)).andExpect(jsonPath("$.data.status").value("draft"));
    }

    @Test
    void unpublish_otherTeachersDeck_returns403_AC_BT_34() throws Exception {
        UUID deck = deckWithCards(teacherB, "Của B", 1, true);
        asA(post(TEACHER + "/" + deck + "/unpublish")).andExpect(status().isForbidden());
        assertThat(statusOf(deck)).isEqualTo("published");
    }

    @Test
    void unpublish_draft_returns409_AC_BT_35() throws Exception {
        UUID deck = data.deck(teacherA, "Nháp").insert();
        asA(post(TEACHER + "/" + deck + "/unpublish"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VOCAB_DECK_NOT_PUBLISHED"));
        asAdmin(json(post(ADMIN + "/" + deck + "/unpublish"), "{\"reason\":\"x\"}"))
                .andExpect(jsonPath("$.code").value("VOCAB_DECK_NOT_PUBLISHED"));
    }

    @Test
    void unpublish_adminBlankReason_returns400_AC_BT_36() throws Exception {
        UUID deck = deckWithCards(teacherA, "Bộ", 1, true);
        asAdmin(json(post(ADMIN + "/" + deck + "/unpublish"), "{\"reason\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("reason"));
        assertThat(statusOf(deck)).isEqualTo("published");
    }

    // ---------------------------------------------------------------- xóa (UC-BT-07)

    @Test
    void delete_publishedDeck_softDeletedAndListedUnderDeleted_AC_BT_39_AC_BT_40() throws Exception {
        UUID deck = deckWithCards(teacherA, "TOEIC 1", 1, true);
        asA(delete(TEACHER + "/" + deck)).andExpect(status().isNoContent());
        assertThat(deletedAtOf(deck)).isNotNull();
        assertThat(statusOf(deck)).isEqualTo("published");
        asA(get(TEACHER)).andExpect(jsonPath("$.data.totalElements").value(0));
        asA(get(TEACHER).param("status", "deleted")).andExpect(jsonPath("$.data.items[0].id").value(deck.toString()));
    }

    @Test
    void delete_otherTeacherOrAlreadyDeleted_rejected_AC_BT_41_AC_BT_42() throws Exception {
        UUID ofB = data.deck(teacherB, "Của B").insert();
        UUID gone = data.deck(teacherA, "Đã xóa").deletedAt(Instant.now()).insert();
        asA(delete(TEACHER + "/" + ofB)).andExpect(status().isForbidden());
        asA(delete(TEACHER + "/" + gone)).andExpect(status().isNotFound());
        assertThat(deletedAtOf(ofB)).isNull();
    }

    // ---------------------------------------------------------------- khôi phục (UC-BT-08)

    @Test
    void restore_withinRetention_backToDraftWithContent_AC_BT_45() throws Exception {
        UUID deck = deckWithCards(teacherA, "TOEIC 1", 2, true);
        jdbc.update("UPDATE vocab_decks SET deleted_at = now() - interval '5 days' WHERE id = ?", deck);
        asA(post(TEACHER + "/" + deck + "/restore")).andExpect(status().isNoContent());
        assertThat(deletedAtOf(deck)).isNull();
        assertThat(statusOf(deck)).isEqualTo("draft");
        asA(get(TEACHER + "/" + deck)).andExpect(jsonPath("$.data.groups.length()").value(2));
    }

    @Test
    void restore_nameTaken_asksNewName_AC_BT_46() throws Exception {
        UUID old = data.deck(teacherA, "TOEIC 1").deletedAt(Instant.now().minus(2, ChronoUnit.DAYS)).insert();
        data.deck(teacherA, "toeic 1").insert();
        asA(post(TEACHER + "/" + old + "/restore"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VOCAB_DECK_NAME_TAKEN"));
        asA(json(post(TEACHER + "/" + old + "/restore"), "{\"name\":\"TOEIC 1 (cũ)\"}"))
                .andExpect(status().isNoContent());
        assertThat(jdbc.queryForObject("SELECT name FROM vocab_decks WHERE id = ?", String.class, old))
                .isEqualTo("TOEIC 1 (cũ)");
    }

    @Test
    void restore_expiredOrNotDeleted_rejected_AC_BT_47_AC_BT_56() throws Exception {
        UUID expired = data.deck(teacherA, "Quá hạn").deletedAt(Instant.now().minus(31, ChronoUnit.DAYS)).insert();
        UUID active = data.deck(teacherA, "Đang có").insert();
        asA(post(TEACHER + "/" + expired + "/restore"))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.code").value("VOCAB_DECK_RESTORE_EXPIRED"));
        asA(post(TEACHER + "/" + active + "/restore"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("VOCAB_DECK_NOT_DELETED"));
    }

    @Test
    void restore_otherTeachersDeck_returns403() throws Exception {
        UUID deck = data.deck(teacherB, "Của B").deletedAt(Instant.now()).insert();
        asA(post(TEACHER + "/" + deck + "/restore")).andExpect(status().isForbidden());
        verify(storage, never()).discardUpload(eq(teacherA), any(), anyString());
    }
}
