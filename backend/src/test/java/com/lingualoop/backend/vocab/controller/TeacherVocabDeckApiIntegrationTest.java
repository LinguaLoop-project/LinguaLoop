package com.lingualoop.backend.vocab.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.AbstractMockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.vocab.DeckManageTestData;
import com.lingualoop.backend.storage.dto.StoredObject;
import com.lingualoop.backend.storage.service.FileStorageService;
import com.lingualoop.backend.storage.service.UploadPurpose;

/**
 * API danh sách và tạo bộ thẻ của giáo viên (UC-BT-01, UC-BT-02) trên Postgres thật. Kho tệp S3 được thay bằng mock:
 * ảnh coi như đã tải lên, {@code readHead} trả các byte đầu của tệp.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, DeckManageTestData.class})
class TeacherVocabDeckApiIntegrationTest {

    private static final String DECKS = "/api/v1/teacher/vocab/decks";
    private static final byte[] JPG_HEAD = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 0, 0, 0};
    private static final byte[] PDF_HEAD = "%PDF-1.7".getBytes(StandardCharsets.US_ASCII);
    private static final String CDN = "https://cdn.test/";

    @Autowired private MockMvc mockMvc;
    @Autowired private DeckManageTestData data;
    @MockitoBean private FileStorageService storage;

    private final String base = "bt" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);

    private ResultActions as(UUID user, Role role, AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + data.tokenFor(user, role)));
    }

    private ResultActions asTeacher(UUID teacher, AbstractMockHttpServletRequestBuilder<?> request) throws Exception {
        return as(teacher, Role.TEACHER, request);
    }

    @BeforeEach
    void stubStorage() {
        when(storage.confirmUpload(any(), any(), anyString()))
                .thenAnswer(inv -> new StoredObject(inv.getArgument(2), "image/jpeg", 500 * 1024));
        when(storage.readHead(anyString(), anyInt())).thenReturn(JPG_HEAD);
        when(storage.publicUrl(anyString())).thenAnswer(inv -> CDN + inv.getArgument(0));
    }

    private static MockHttpServletRequestBuilder create(String body) {
        return post(DECKS).contentType(MediaType.APPLICATION_JSON).content(body);
    }

    private static String imageKeyOf(UUID teacher) {
        return "vocab-decks/" + teacher + "/" + UUID.randomUUID() + ".jpg";
    }

    // ---------------------------------------------------------------- danh sách (UC-BT-01)

    @Test
    void listDecks_teacherA_returnsOnlyOwnNonDeletedDecks_AC_BT_01() throws Exception {
        UUID a = data.teacher("GV A");
        UUID b = data.teacher("GV B");
        UUID category = data.category("Học thuật " + base);
        UUID draft = data.deck(a, "A nháp").pro().category(category).image("https://cdn.example.com/a.png").insert();
        data.deck(a, "A xuất bản 1").published().insert();
        data.deck(a, "A xuất bản 2").published().insert();
        data.deck(a, "A đã xóa").deletedAt(Instant.now().minus(1, ChronoUnit.DAYS)).insert();
        data.deck(b, "B 1").published().insert();
        data.deck(b, "B 2").insert();
        data.card(data.group(draft, "G1", false), "word", false);

        String draftItem = "$.data.items[?(@.id=='" + draft + "')]";
        asTeacher(a, get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.items[*].name").value(containsInAnyOrder("A nháp", "A xuất bản 1",
                        "A xuất bản 2")))
                .andExpect(jsonPath(draftItem + ".imageUrl").value("https://cdn.example.com/a.png"))
                .andExpect(jsonPath(draftItem + ".categoryId").value(category.toString()))
                .andExpect(jsonPath(draftItem + ".categoryName").value("Học thuật " + base))
                .andExpect(jsonPath(draftItem + ".groupCount").value(1))
                .andExpect(jsonPath(draftItem + ".cardCount").value(1))
                .andExpect(jsonPath(draftItem + ".pro").value(true))
                .andExpect(jsonPath(draftItem + ".status").value("draft"))
                .andExpect(jsonPath(draftItem + ".updatedAt").isNotEmpty());
    }

    @Test
    void listDecks_noToken_returns401_AC_BT_01() throws Exception {
        mockMvc.perform(get(DECKS)).andExpect(status().isUnauthorized());
        mockMvc.perform(create("{\"name\":\"X\"}")).andExpect(status().isUnauthorized());
    }

    @Test
    void listDecks_invalidStatusValue_returns400_AC_BT_03() throws Exception {
        UUID a = data.teacher("GV A");

        asTeacher(a, get(DECKS).param("status", "abc")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("status"));
        asTeacher(a, get(DECKS).param("status", "DRAFT")).andExpect(status().isOk());
    }

    @Test
    void listDecks_statusDeleted_otherTeachersDeletedDeck_notReturned_AC_BT_04() throws Exception {
        UUID a = data.teacher("GV A");
        UUID b = data.teacher("GV B");
        Instant deletedAt = Instant.now().minus(5, ChronoUnit.DAYS);
        UUID mine = data.deck(a, "A đã xóa").deletedAt(deletedAt).insert();
        data.deck(b, "B vừa xóa").deletedAt(Instant.now()).insert();

        asTeacher(a, get(DECKS).param("status", "deleted")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(mine.toString()))
                .andExpect(jsonPath("$.data.items[0].deletedAt").isNotEmpty());
    }

    @Test
    void listDecks_teacherWithNoDecks_returnsEmptyPage_AC_BT_05() throws Exception {
        asTeacher(data.teacher("GV mới"), get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isEmpty())
                .andExpect(jsonPath("$.data.totalElements").value(0))
                .andExpect(jsonPath("$.data.size").value(10));
        // quản trị viên: chưa có bộ Đã xuất bản nào khớp (bộ Nháp không tính)
        data.deck(data.teacher("GV A"), base + " nháp").insert();
        as(data.admin(), Role.ADMIN, get("/api/v1/admin/vocab/decks").param("q", base)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isEmpty())
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void listDecks_teacher_doesNotSeeSystemDeck_AC_BT_57() throws Exception {
        UUID a = data.teacher("GV A");
        data.deck(null, base + " hệ thống").published().insert();
        data.deck(a, base + " A1").published().insert();
        data.deck(a, base + " A2").published().insert();

        asTeacher(a, get(DECKS)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.items[*].name").value(containsInAnyOrder(base + " A1", base + " A2")));
    }

    @Test
    void listDecks_pageBeyondLast_returnsEmptyContent_AC_BT_58() throws Exception {
        UUID a = data.teacher("GV A");
        for (int i = 1; i <= 25; i++) {
            data.deck(a, "Bộ " + i).insert();
        }

        asTeacher(a, get(DECKS).param("page", "3")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isEmpty())
                .andExpect(jsonPath("$.data.page").value(3))
                .andExpect(jsonPath("$.data.totalElements").value(25))
                .andExpect(jsonPath("$.data.totalPages").value(3));
        asTeacher(a, get(DECKS).param("page", "2")).andExpect(jsonPath("$.data.items.length()").value(5));
    }

    @Test
    void listDecks_negativePage_returns400_AC_BT_58() throws Exception {
        asTeacher(data.teacher("GV A"), get(DECKS).param("page", "-1")).andExpect(status().isBadRequest());
    }

    @Test
    void listDecks_unknownCategoryId_returnsEmpty_AC_BT_59() throws Exception {
        UUID a = data.teacher("GV A");
        data.deck(a, "Bộ 1").insert();

        asTeacher(a, get(DECKS).param("categoryId", UUID.randomUUID().toString())).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items").isEmpty());
        asTeacher(a, get(DECKS).param("categoryId", "khong-phai-uuid")).andExpect(status().isBadRequest());
    }

    @Test
    void listDecks_qBlank_treatedAsNoFilter_AC_BT_60() throws Exception {
        UUID a = data.teacher("GV A");
        data.deck(a, "Bộ 1").insert();
        data.deck(a, "Bộ 2").published().insert();

        asTeacher(a, get(DECKS).param("q", "   ")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    void listDecks_adminCallsTeacherEndpoint_returns403_AC_BT_63() throws Exception {
        as(data.admin(), Role.ADMIN, get(DECKS)).andExpect(status().isForbidden());
        as(data.user(Role.STUDENT, "HV"), Role.STUDENT, get(DECKS)).andExpect(status().isForbidden());
    }

    @Test
    void createDeck_admin_returns403_AC_BT_63() throws Exception {
        UUID admin = data.admin();

        as(admin, Role.ADMIN, create("{\"name\":\"" + base + "\"}")).andExpect(status().isForbidden());

        assertThat(data.countDecks(admin)).isZero();
    }

    // ---------------------------------------------------------------- danh mục để chọn (BR-BT-14)

    @Test
    void listCategories_teacherAndAdmin_getAllCategoriesInDisplayOrder() throws Exception {
        UUID first = data.category("Một " + base);
        UUID second = data.category("Hai " + base);
        String byId = "$.data[?(@.id=='%s')].name";

        for (String url : List.of("/api/v1/teacher/vocab/categories", "/api/v1/admin/vocab/categories")) {
            UUID user = url.contains("/admin/") ? data.admin() : data.teacher("GV A");
            Role role = url.contains("/admin/") ? Role.ADMIN : Role.TEACHER;
            String body = as(user, role, get(url)).andExpect(status().isOk())
                    .andExpect(jsonPath(byId.formatted(first)).value(contains("Một " + base)))
                    .andExpect(jsonPath(byId.formatted(second)).value(contains("Hai " + base)))
                    .andReturn().getResponse().getContentAsString();
            // thêm trước đứng trước (BR-CD-03)
            assertThat(body.indexOf(first.toString())).isLessThan(body.indexOf(second.toString()));
        }
    }

    @Test
    void listCategories_studentOrAnonymous_denied() throws Exception {
        as(data.user(Role.STUDENT, "HV"), Role.STUDENT, get("/api/v1/teacher/vocab/categories"))
                .andExpect(status().isForbidden());
        as(data.teacher("GV A"), Role.TEACHER, get("/api/v1/admin/vocab/categories"))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/v1/teacher/vocab/categories")).andExpect(status().isUnauthorized());
    }

    // ---------------------------------------------------------------- tạo bộ (UC-BT-02)

    @Test
    void createDeck_validNameJpgCategoryPro_returns201Draft_AC_BT_07() throws Exception {
        UUID a = data.teacher("GV A");
        UUID academic = data.category("Học thuật " + base);

        String key = imageKeyOf(a);

        asTeacher(a, create("{\"name\":\"TOEIC 1\",\"categoryId\":\"" + academic + "\",\"pro\":true,"
                + "\"imageKey\":\"" + key + "\"}"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.id").isNotEmpty())
                .andExpect(jsonPath("$.data.name").value("TOEIC 1"))
                .andExpect(jsonPath("$.data.status").value("draft"))
                .andExpect(jsonPath("$.data.pro").value(true))
                .andExpect(jsonPath("$.data.categoryId").value(academic.toString()))
                .andExpect(jsonPath("$.data.categoryName").value("Học thuật " + base))
                .andExpect(jsonPath("$.data.imageUrl").value(CDN + key))
                .andExpect(jsonPath("$.data.groupCount").value(0))
                .andExpect(jsonPath("$.data.cardCount").value(0));

        asTeacher(a, get(DECKS).param("status", "draft")).andExpect(jsonPath("$.data.items[0].name").value("TOEIC 1"))
                .andExpect(jsonPath("$.data.items[0].imageUrl").value(CDN + key));
        verify(storage).confirmUpload(a, UploadPurpose.DECK_IMAGE, key);
    }

    @Test
    void createDeck_unknownCategoryId_returns400or404_AC_BT_07() throws Exception {
        UUID a = data.teacher("GV A");

        asTeacher(a, create("{\"name\":\"Bộ 1\",\"categoryId\":\"" + UUID.randomUUID() + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("categoryId"));

        assertThat(data.countDecks(a)).isZero();
    }

    @Test
    void createDeck_nameOnly_usesDefaultImageNoCategoryNotPro_AC_BT_08() throws Exception {
        asTeacher(data.teacher("GV A"), create("{\"name\":\"Bộ 1\"}")).andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.imageUrl").doesNotExist())
                .andExpect(jsonPath("$.data.categoryId").doesNotExist())
                .andExpect(jsonPath("$.data.pro").value(false))
                .andExpect(jsonPath("$.data.status").value("draft"));
    }

    @Test
    void createDeck_blankName_returns400_AC_BT_10() throws Exception {
        UUID a = data.teacher("GV A");

        asTeacher(a, create("{\"name\":\"\"}")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));

        assertThat(data.countDecks(a)).isZero();
    }

    @Test
    void createDeck_duplicateName_returns409_AC_BT_11() throws Exception {
        UUID a = data.teacher("GV A");
        data.deck(a, "TOEIC Essential 1000").insert();

        asTeacher(a, create("{\"name\":\"toeic essential 1000\"}")).andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("CONFLICT"))
                .andExpect(jsonPath("$.message").value("Bạn đã có bộ thẻ cùng tên"));
    }

    @Test
    void createDeck_pdfImage_returns400AndNothingSaved_AC_BT_12() throws Exception {
        UUID a = data.teacher("GV A");

        String key = imageKeyOf(a);
        when(storage.readHead(anyString(), anyInt())).thenReturn(PDF_HEAD);

        asTeacher(a, create("{\"name\":\"Bộ 1\",\"imageKey\":\"" + key + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("image"))
                .andExpect(jsonPath("$.errors[0].code").value("ImageType"));

        assertThat(data.countDecks(a)).isZero();
        verify(storage).discardUpload(a, UploadPurpose.DECK_IMAGE, key);
    }

    @Test
    void createDeck_name101Chars_returns400_name100Chars_returns201_AC_BT_65() throws Exception {
        UUID a = data.teacher("GV A");

        asTeacher(a, create("{\"name\":\"" + "x".repeat(101) + "\"}")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].code").value("Size"));
        asTeacher(a, create("{\"name\":\"" + "x".repeat(100) + "\"}")).andExpect(status().isCreated());
    }

    @Test
    void createDeck_nameWithPaddingSpaces_savedTrimmed_AC_BT_66() throws Exception {
        asTeacher(data.teacher("GV A"), create("{\"name\":\"  TOEIC 1  \"}")).andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value("TOEIC 1"));
    }

    @Test
    void createDeck_pdfRenamedPng_returns400_AC_BT_69() throws Exception {
        UUID a = data.teacher("GV A");

        when(storage.readHead(anyString(), anyInt())).thenReturn(PDF_HEAD);

        asTeacher(a, create("{\"name\":\"Bộ 1\",\"imageKey\":\"" + imageKeyOf(a) + "\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("image"));

        assertThat(data.countDecks(a)).isZero();
    }
}
