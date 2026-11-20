package com.lingualoop.backend.user.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.AdminUserTestData;

/**
 * API giao lại nội dung (UC-QT-05, 06, 07). Danh sách nội dung cần giao gồm dữ liệu của mọi test trên cùng cơ sở dữ
 * liệu, nên mỗi test đặt tên nội dung với tiền tố {@link #base} và tìm theo tiền tố đó.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, AdminUserTestData.class})
class AdminContentTransferApiIntegrationTest {

    private static final String TRANSFERS = "/api/v1/admin/content-transfers";
    private static final String USERS = "/api/v1/admin/users";

    @Autowired private MockMvc mockMvc;
    @Autowired private AdminUserTestData data;

    private final String base = "qt" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    private UUID admin;

    @BeforeEach
    void setUp() {
        admin = data.admin();
    }

    private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, data.bearer(admin, Role.ADMIN)));
    }

    private ResultActions items(String... params) throws Exception {
        MockHttpServletRequestBuilder request = get(TRANSFERS + "/items").param("q", base);
        for (int i = 0; i < params.length; i += 2) {
            request.param(params[i], params[i + 1]);
        }
        return asAdmin(request);
    }

    private static String item(String type, UUID id, UUID owner) {
        return "{\"type\":\"" + type + "\",\"id\":\"" + id + "\",\"ownerId\":"
                + (owner == null ? "null" : "\"" + owner + "\"") + "}";
    }

    private ResultActions transferSelected(UUID recipient, String... items) throws Exception {
        String body = "{\"recipientId\":\"" + recipient + "\",\"items\":[" + String.join(",", items) + "]}";
        return asAdmin(post(TRANSFERS + "/selected").contentType(MediaType.APPLICATION_JSON).content(body));
    }

    private ResultActions transferAll(UUID source, UUID recipient, long lessons, long decks) throws Exception {
        return asAdmin(post(USERS + "/" + source + "/transfer-all").contentType(MediaType.APPLICATION_JSON)
                .content("{\"recipientId\":\"" + recipient + "\",\"expectedLessons\":" + lessons
                        + ",\"expectedDecks\":" + decks + "}"));
    }

    private UUID lockedTeacher(String name) {
        UUID teacher = data.teacher(name);
        data.lock(teacher);
        return teacher;
    }

    // ---------------------------------------------------------------- UC-QT-05

    @Test
    void items_onlyPublishedContentOfLockedTeachers_AC_QT_25() throws Exception {
        UUID a = lockedTeacher(base + " A");
        UUID b = lockedTeacher(base + " B");
        UUID c = data.teacher(base + " C");
        UUID a1 = data.lesson(a, base + " A bài 1", true);
        data.lesson(a, base + " A bài 2", true);
        data.lesson(a, base + " A bài 3", true);
        data.lesson(a, base + " A nháp 1", false);
        data.lesson(a, base + " A nháp 2", false);
        data.deck(a, base + " A bộ", true);
        data.deck(b, base + " B bộ 1", true);
        data.deck(b, base + " B bộ 2", true);
        for (int i = 0; i < 5; i++) {
            data.lesson(c, base + " C bài " + i, true);
        }
        data.lessonReport(a1, "waiting_teacher");

        items().andExpect(status().isOk())
                .andExpect(jsonPath("$.data.size").value(20))
                .andExpect(jsonPath("$.data.totalElements").value(6))
                .andExpect(jsonPath("$.data.items[*].name", not(hasItem(base + " A nháp 1"))))
                .andExpect(jsonPath("$.data.items[*].ownerId", not(hasItem(c.toString()))));
        items("type", "lesson", "owner", a.toString()).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[?(@.id == '" + a1 + "')].openReports").value(1))
                .andExpect(jsonPath("$.data.items[0].ownerName").value(base + " A"))
                .andExpect(jsonPath("$.data.items[0].lockedAt").exists());
    }

    @Test
    void items_filterByOwnerAndType_AC_QT_26() throws Exception {
        UUID a = lockedTeacher(base + " A");
        UUID b = lockedTeacher(base + " B");
        UUID deck = data.deck(a, base + " A bộ", true);
        data.lesson(a, base + " A bài", true);
        data.deck(b, base + " B bộ", true);

        items("owner", a.toString(), "type", "deck").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(deck.toString()))
                .andExpect(jsonPath("$.data.items[0].type").value("deck"));
    }

    @Test
    void items_noMatch_returnsEmpty_AC_QT_51() throws Exception {
        asAdmin(get(TRANSFERS + "/items").param("q", "zzz" + base)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isEmpty());
    }

    @Test
    void items_systemDeckListedAsSystem_AC_QT_52() throws Exception {
        UUID oxford = data.deck(null, base + " Oxford 3000", true);

        items("owner", "system").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(oxford.toString()))
                .andExpect(jsonPath("$.data.items[0].ownerId").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].lockedAt").doesNotExist())
                .andExpect(jsonPath("$.data.items[0].openReports").value(0));
    }

    // ---------------------------------------------------------------- UC-QT-06

    @Test
    void transferSelected_movesOnlyChosenItemsAndNotifies_AC_QT_29() throws Exception {
        UUID thanh = lockedTeacher(base + " Lê Thanh");
        UUID an = data.teacher(base + " Nguyễn An");
        UUID l1 = data.lesson(thanh, base + " bài 1", true);
        UUID l2 = data.lesson(thanh, base + " bài 2", true);
        UUID l3 = data.lesson(thanh, base + " bài 3", true);
        UUID d1 = data.deck(thanh, base + " bộ 1", true);
        UUID d2 = data.deck(thanh, base + " bộ 2", true);

        transferSelected(an, item("lesson", l1, thanh), item("lesson", l2, thanh), item("deck", d1, thanh))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lessons").value(2))
                .andExpect(jsonPath("$.data.decks").value(1));

        assertThat(List.of(data.lessonOwner(l1), data.lessonOwner(l2), data.deckOwner(d1))).containsOnly(an);
        assertThat(data.lessonStatus(l1)).isEqualTo("published");
        assertThat(data.notifications(an)).containsExactly("Quản trị viên đã giao cho bạn 2 bài học và 1 bộ thẻ.");
        assertThat(data.countAudit(l1, "transfer")).isEqualTo(1);
        items("owner", thanh.toString()).andExpect(jsonPath("$.data.items[*].id")
                .value(containsInAnyOrder(l3.toString(), d2.toString())));
    }

    @Test
    void transferSelected_openReportFollowsContent_AC_QT_30() throws Exception {
        UUID thanh = lockedTeacher(base + " Lê Thanh");
        UUID an = data.teacher(base + " Nguyễn An");
        UUID deck = data.deck(thanh, base + " bộ", true);
        UUID report = data.deckReport(deck, "waiting_teacher");

        transferSelected(an, item("deck", deck, thanh)).andExpect(status().isOk());

        assertThat(data.reportStatus(report)).isEqualTo("waiting_teacher");
        mockMvc.perform(get("/api/v1/teacher/reports").header(HttpHeaders.AUTHORIZATION, data.bearer(an, Role.TEACHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[*].containerId", hasItem(deck.toString())));
    }

    @Test
    void transferSelected_nothingSelected_rejected_AC_QT_31() throws Exception {
        UUID an = data.teacher(base + " Nguyễn An");

        transferSelected(an).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("TRANSFER_NOTHING_SELECTED"));
    }

    @Test
    void transferSelected_recipientJustLocked_rejectedAndHiddenFromRecipients_AC_QT_34() throws Exception {
        UUID thanh = lockedTeacher(base + " Lê Thanh");
        UUID an = data.teacher(base + " Nguyễn An");
        UUID lesson = data.lesson(thanh, base + " bài", true);
        data.lock(an);

        transferSelected(an, item("lesson", lesson, thanh)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSFER_RECIPIENT_INVALID"));
        assertThat(data.lessonOwner(lesson)).isEqualTo(thanh);
        asAdmin(get(TRANSFERS + "/recipients").param("q", base)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data[*].id", not(hasItem(an.toString()))));
    }

    @Test
    void transferSelected_nameConflictCaseInsensitive_movesNothing_AC_QT_35() throws Exception {
        UUID thanh = lockedTeacher(base + " Lê Thanh");
        UUID an = data.teacher(base + " Nguyễn An");
        data.deck(an, base + " TOEIC Essential 1000", true);
        UUID deck = data.deck(thanh, base + " toeic essential 1000", true);
        UUID l1 = data.lesson(thanh, base + " bài 1", true);
        UUID l2 = data.lesson(thanh, base + " bài 2", true);

        transferSelected(an, item("deck", deck, thanh), item("lesson", l1, thanh), item("lesson", l2, thanh))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSFER_NAME_CONFLICT"))
                .andExpect(jsonPath("$.details.conflicts.length()").value(1))
                .andExpect(jsonPath("$.details.conflicts[0].name").value(base + " toeic essential 1000"));
        assertThat(List.of(data.lessonOwner(l1), data.lessonOwner(l2), data.deckOwner(deck))).containsOnly(thanh);
    }

    @Test
    void transferSelected_itemAlreadyMoved_movesNothing_AC_QT_36() throws Exception {
        UUID thanh = lockedTeacher(base + " Lê Thanh");
        UUID an = data.teacher(base + " Nguyễn An");
        UUID binh = data.teacher(base + " Trần Bình");
        UUID moved = data.lesson(thanh, base + " bài 1", true);
        UUID other = data.lesson(thanh, base + " bài 2", true);
        transferSelected(binh, item("lesson", moved, thanh)).andExpect(status().isOk());

        transferSelected(an, item("lesson", moved, thanh), item("lesson", other, thanh))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSFER_CONTENT_CHANGED"));
        assertThat(data.lessonOwner(other)).isEqualTo(thanh);
    }

    @Test
    void transferSelected_ownerUnlockedMeanwhile_movesNothing_UC_QT_06_7c() throws Exception {
        UUID thanh = lockedTeacher(base + " Lê Thanh");
        UUID an = data.teacher(base + " Nguyễn An");
        UUID lesson = data.lesson(thanh, base + " bài", true);
        asAdmin(post(USERS + "/" + thanh + "/unlock")).andExpect(status().isOk());

        transferSelected(an, item("lesson", lesson, thanh)).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSFER_CONTENT_CHANGED"));
    }

    @Test
    void transferSelected_systemDeckFromReport_AC_QT_46() throws Exception {
        UUID an = data.teacher(base + " Nguyễn An");
        UUID oxford = data.deck(null, base + " Oxford 3000", true);
        UUID report = data.deckReport(oxford, "waiting_teacher");

        transferSelected(an, item("deck", oxford, null)).andExpect(status().isOk());

        assertThat(data.deckOwner(oxford)).isEqualTo(an);
        assertThat(data.reportStatus(report)).isEqualTo("waiting_teacher");
    }

    @Test
    void recipients_onlyActiveTeachersExceptExcluded_BR_QT_06() throws Exception {
        UUID an = data.teacher(base + " Nguyễn An");
        UUID thanh = data.teacher(base + " Lê Thanh");
        lockedTeacher(base + " Bị khóa");
        data.user(Role.STUDENT, base + " Học viên");

        asAdmin(get(TRANSFERS + "/recipients").param("q", base).param("exclude", thanh.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(an.toString()));
    }

    // ---------------------------------------------------------------- UC-QT-07

    @Test
    void transferAll_movesLibraryContentIncludingDrafts_AC_QT_38() throws Exception {
        UUID thanh = lockedTeacher(base + " Lê Thanh");
        UUID an = data.teacher(base + " Nguyễn An");
        UUID l1 = data.lesson(thanh, base + " bài 1", true);
        data.lesson(thanh, base + " bài 2", true);
        data.lesson(thanh, base + " bài 3", true);
        UUID draft = data.lesson(thanh, base + " nháp", false);
        data.deck(thanh, base + " bộ 1", true);
        UUID draftDeck = data.deck(thanh, base + " bộ nháp", false);
        data.lessonReport(l1, "waiting_teacher");
        data.lessonReport(l1, "waiting_admin");
        UUID r3 = data.deckReport(draftDeck, "waiting_teacher");

        asAdmin(get(USERS + "/" + thanh + "/content-summary")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lessons").value(4))
                .andExpect(jsonPath("$.data.draftLessons").value(1))
                .andExpect(jsonPath("$.data.decks").value(2))
                .andExpect(jsonPath("$.data.openReports").value(3));

        transferAll(thanh, an, 4, 2).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lessons").value(4))
                .andExpect(jsonPath("$.data.decks").value(2));

        assertThat(data.lessonOwner(draft)).isEqualTo(an);
        assertThat(data.lessonStatus(draft)).isEqualTo("draft");
        assertThat(data.reportStatus(r3)).isEqualTo("waiting_teacher");
        asAdmin(get(USERS + "/" + thanh + "/content-summary"))
                .andExpect(jsonPath("$.data.lessons").value(0))
                .andExpect(jsonPath("$.data.decks").value(0));
        assertThat(data.countAudit(thanh, "transfer")).isEqualTo(1);
    }

    @Test
    void transferAll_activeTeacherThenChangeRole_AC_QT_39() throws Exception {
        UUID binh = data.teacher(base + " Trần Bình");
        UUID an = data.teacher(base + " Nguyễn An");
        data.lesson(binh, base + " bài 1", true);
        data.lesson(binh, base + " bài 2", false);

        transferAll(binh, an, 2, 0).andExpect(status().isOk());
        asAdmin(post(USERS + "/" + binh + "/role").contentType(MediaType.APPLICATION_JSON)
                .content("{\"role\":\"student\"}")).andExpect(status().isOk());
    }

    @Test
    void transferAll_noContent_rejected_AC_QT_40() throws Exception {
        UUID thanh = lockedTeacher(base + " Lê Thanh");
        UUID an = data.teacher(base + " Nguyễn An");

        transferAll(thanh, an, 0, 0).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSFER_NO_CONTENT"));
    }

    @Test
    void transferAll_recipientLocked_rejected_AC_QT_43() throws Exception {
        UUID thanh = lockedTeacher(base + " Lê Thanh");
        UUID an = lockedTeacher(base + " Nguyễn An");
        UUID lesson = data.lesson(thanh, base + " bài", true);

        transferAll(thanh, an, 1, 0).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSFER_RECIPIENT_INVALID"));
        transferAll(thanh, thanh, 1, 0).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSFER_RECIPIENT_INVALID"));
        assertThat(data.lessonOwner(lesson)).isEqualTo(thanh);
    }

    @Test
    void transferAll_titleConflict_movesNothing_AC_QT_44() throws Exception {
        UUID thanh = lockedTeacher(base + " Lê Thanh");
        UUID an = data.teacher(base + " Nguyễn An");
        data.lesson(an, base + " Airport Check-in", true);
        UUID lesson = data.lesson(thanh, base + " airport check-in", true);
        UUID other = data.lesson(thanh, base + " khác", true);

        transferAll(thanh, an, 2, 0).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSFER_NAME_CONFLICT"))
                .andExpect(jsonPath("$.details.conflicts[0].id").value(lesson.toString()));
        assertThat(data.lessonOwner(other)).isEqualTo(thanh);
    }

    @Test
    void transferAll_contentChangedSinceSummary_rejectedWithNewSummary_AC_QT_53() throws Exception {
        UUID binh = data.teacher(base + " Trần Bình");
        UUID an = data.teacher(base + " Nguyễn An");
        data.lesson(binh, base + " bài 1", true);
        data.lesson(binh, base + " bài 2", true);
        UUID added = data.lesson(binh, base + " bài 3", false);

        transferAll(binh, an, 2, 0).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSFER_CONTENT_CHANGED"))
                .andExpect(jsonPath("$.details.summary.lessons").value(3));
        assertThat(data.lessonOwner(added)).isEqualTo(binh);
    }

    @Test
    void transferAll_personalContentStays_AC_QT_55() throws Exception {
        UUID lan = lockedTeacher(base + " Hoàng Lan");
        UUID an = data.teacher(base + " Nguyễn An");
        UUID l1 = data.lesson(lan, base + " bài 1", true);
        UUID l2 = data.lesson(lan, base + " bài 2", true);
        UUID personalLesson = data.lesson(lan, base + " bài cá nhân", "personal", false);
        UUID personalDeck = data.deck(lan, base + " bộ cá nhân", "personal", false);

        asAdmin(get(USERS + "/" + lan + "/content-summary"))
                .andExpect(jsonPath("$.data.lessons").value(2))
                .andExpect(jsonPath("$.data.decks").value(0));
        transferAll(lan, an, 2, 0).andExpect(status().isOk());

        assertThat(List.of(l1, l2).stream().map(data::lessonOwner).collect(Collectors.toSet())).containsOnly(an);
        assertThat(data.lessonOwner(personalLesson)).isEqualTo(lan);
        assertThat(data.deckOwner(personalDeck)).isEqualTo(lan);
    }

    @Test
    void transferAll_sourceNotTeacher_rejected_UC_QT_07() throws Exception {
        UUID student = data.user(Role.STUDENT, base + " Học viên");
        UUID an = data.teacher(base + " Nguyễn An");

        transferAll(student, an, 0, 0).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TRANSFER_SOURCE_NOT_TEACHER"));
    }
}
