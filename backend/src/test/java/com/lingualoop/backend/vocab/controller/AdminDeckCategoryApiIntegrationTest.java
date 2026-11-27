package com.lingualoop.backend.vocab.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import org.hibernate.SessionFactory;
import org.hibernate.stat.Statistics;
import org.junit.jupiter.api.BeforeEach;
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

import com.jayway.jsonpath.JsonPath;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.AdminUserTestData;
import com.lingualoop.backend.vocab.service.AdminDeckCategoryService;

import jakarta.persistence.EntityManagerFactory;

/**
 * Quản lý danh mục bộ thẻ (UC-CD-04 đến 06). Bảng danh mục dùng chung giữa các test nên mỗi test đặt tên với tiền tố
 * {@link #base} và tìm theo tiền tố đó. AC-CD-17 (hệ thống chưa có danh mục nào) không dựng được trên cơ sở dữ liệu
 * dùng chung; phía máy chủ trả danh sách rỗng giống AC-CD-18. AC-CD-20, 23, 25, 28 (hủy, mất kết nối) thuộc phía giao
 * diện.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, AdminUserTestData.class})
class AdminDeckCategoryApiIntegrationTest {

    private static final String CATEGORIES = "/api/v1/admin/vocab/categories";

    @Autowired private MockMvc mockMvc;
    @Autowired private AdminUserTestData data;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private AdminDeckCategoryService service;
    @Autowired private EntityManagerFactory entityManagerFactory;

    private final String base = "cd" + UUID.randomUUID().toString().substring(0, 8) + " ";
    private UUID admin;

    @BeforeEach
    void setUp() {
        admin = data.admin();
    }

    private ResultActions asAdmin(MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, data.bearer(admin, Role.ADMIN)));
    }

    private ResultActions list(String q) throws Exception {
        return asAdmin(get(CATEGORIES).param("q", q));
    }

    private ResultActions create(String name) throws Exception {
        return asAdmin(post(CATEGORIES).contentType(MediaType.APPLICATION_JSON).content(nameBody(name)));
    }

    private ResultActions rename(UUID id, String name) throws Exception {
        return asAdmin(put(CATEGORIES + "/" + id).contentType(MediaType.APPLICATION_JSON).content(nameBody(name)));
    }

    private static String nameBody(String name) {
        return name == null ? "{\"name\":null}" : "{\"name\":\"" + name + "\"}";
    }

    private UUID category(String name) {
        return jdbc.queryForObject("INSERT INTO deck_categories (name) VALUES (?) RETURNING id", UUID.class, name);
    }

    /** Bộ hệ thống thuộc {@code category}; {@code kind} {@code library} hoặc {@code personal}. */
    private void deck(UUID category, String kind, String status, boolean deleted) {
        UUID owner = "personal".equals(kind) ? data.user(Role.STUDENT, "Học viên") : null;
        jdbc.update("""
                INSERT INTO vocab_decks (owner_id, kind, name, category_id, status, deleted_at)
                VALUES (?, ?, ?, ?, ?, ?)""", owner, kind, base + UUID.randomUUID(), category, status,
                deleted ? Timestamp.from(Instant.now()) : null);
    }

    private void publishedDecks(UUID category, int count) {
        for (int i = 0; i < count; i++) {
            deck(category, "library", "published", false);
        }
    }

    private String nameOf(UUID category) {
        return jdbc.queryForObject("SELECT name FROM deck_categories WHERE id = ?", String.class, category);
    }

    private List<Map<String, Object>> audits(UUID category) {
        return jdbc.queryForList("""
                SELECT action, target_name, changes::text AS changes FROM audit_logs
                WHERE target_type = 'category' AND target_id = ? ORDER BY id""", category);
    }

    private static String json(ResultActions result) throws Exception {
        return result.andReturn().getResponse().getContentAsString();
    }

    // ---------------------------------------------------------------- UC-CD-04

    @Test
    void list_inDisplayOrderWithPublishedDeckCounts_AC_CD_15() throws Exception {
        UUID academic = category(base + "Học thuật");
        category(base + "Công việc");
        category(base + "Giao tiếp cơ bản");
        publishedDecks(academic, 4);
        deck(academic, "library", "draft", false);
        deck(academic, "library", "published", true);
        deck(academic, "personal", "published", false);

        String body = json(list(base).andExpect(status().isOk()));

        assertThat(JsonPath.<List<String>>read(body, "$.data[*].name"))
                .containsExactly(base + "Học thuật", base + "Công việc", base + "Giao tiếp cơ bản");
        assertThat(JsonPath.<List<Integer>>read(body, "$.data[*].publishedDecks")).containsExactly(4, 0, 0);
        assertThat(JsonPath.<List<String>>read(body, "$.data[*].updatedAt")).allSatisfy(d -> assertThat(d).isNotBlank());
    }

    @Test
    void list_searchIgnoresCase_AC_CD_16() throws Exception {
        category(base + "Học thuật");
        category(base + "Công việc");

        list(base + "HỌC").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].name").value(base + "Học thuật"));
    }

    @Test
    void list_noMatch_returnsEmpty_AC_CD_18() throws Exception {
        category(base + "Học thuật");

        list(base + "zzz").andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void list_countsInOneQuery_noNPlusOne() {
        for (int i = 0; i < 5; i++) {
            publishedDecks(category(base + "Danh mục " + i), 2);
        }
        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);
        stats.clear();
        try {
            assertThat(service.list(base)).hasSize(5).allSatisfy(c -> assertThat(c.publishedDecks()).isEqualTo(2));
            assertThat(stats.getPrepareStatementCount()).isEqualTo(1);
        } finally {
            stats.setStatisticsEnabled(false);
        }
    }

    @Test
    void list_byTeacher_isForbidden() throws Exception {
        UUID teacher = data.teacher("Giáo viên");
        mockMvc.perform(get(CATEGORIES).header(HttpHeaders.AUTHORIZATION, data.bearer(teacher, Role.TEACHER)))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- UC-CD-05

    @Test
    void create_addsCategoryAtEnd_teacherCanPick_logs_AC_CD_19() throws Exception {
        category(base + "Học thuật");
        category(base + "Công việc");
        category(base + "Giao tiếp cơ bản");

        String body = json(create(base + "Luyện thi").andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value(base + "Luyện thi"))
                .andExpect(jsonPath("$.data.publishedDecks").value(0)));
        UUID id = UUID.fromString(JsonPath.read(body, "$.data.id"));

        assertThat(JsonPath.<List<String>>read(json(list(base)), "$.data[*].name")).containsExactly(
                base + "Học thuật", base + "Công việc", base + "Giao tiếp cơ bản", base + "Luyện thi");
        UUID teacher = data.teacher("Giáo viên");
        mockMvc.perform(get("/api/v1/teacher/vocab/categories")
                .header(HttpHeaders.AUTHORIZATION, data.bearer(teacher, Role.TEACHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == '" + id + "')].name").value(base + "Luyện thi"));
        assertThat(audits(id)).singleElement().satisfies(a -> {
            assertThat(a).containsEntry("action", "create").containsEntry("target_name", base + "Luyện thi");
            assertThat((String) a.get("changes")).contains("\"new\": \"" + base + "Luyện thi\"");
        });
    }

    @Test
    void create_blankOrTooLong_rejected_AC_CD_21() throws Exception {
        create("").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
        create(base + "x".repeat(101 - base.length())).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("Size"));

        list(base).andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void create_duplicateNameIgnoringCase_rejected_AC_CD_22() throws Exception {
        category(base + "Học thuật");

        create(base + "học thuật").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DECK_CATEGORY_NAME_TAKEN"))
                .andExpect(jsonPath("$.message").value("Tên danh mục đã tồn tại"));
        list(base).andExpect(jsonPath("$.data.length()").value(1));
    }

    // ---------------------------------------------------------------- UC-CD-06

    @Test
    void rename_keepsDecksAndOrder_refreshesUpdatedAt_logsOldAndNew_AC_CD_24() throws Exception {
        UUID academic = category(base + "Học thuật");
        category(base + "Công việc");
        publishedDecks(academic, 4);
        Instant old = Instant.parse("2026-01-01T00:00:00Z");
        jdbc.update("UPDATE deck_categories SET updated_at = ? WHERE id = ?", Timestamp.from(old), academic);

        String body = json(rename(academic, base + "Học thuật và thi cử").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value(base + "Học thuật và thi cử"))
                .andExpect(jsonPath("$.data.publishedDecks").value(4)));
        assertThat(Instant.parse(JsonPath.read(body, "$.data.updatedAt"))).isAfter(old);

        assertThat(JsonPath.<List<String>>read(json(list(base)), "$.data[*].name"))
                .containsExactly(base + "Học thuật và thi cử", base + "Công việc");
        assertThat(audits(academic)).singleElement().satisfies(a -> {
            assertThat(a).containsEntry("action", "update");
            assertThat((String) a.get("changes")).contains("\"old\": \"" + base + "Học thuật\"")
                    .contains("\"new\": \"" + base + "Học thuật và thi cử\"");
        });
    }

    @Test
    void rename_blank_keepsOldName_AC_CD_26() throws Exception {
        UUID academic = category(base + "Học thuật");

        rename(academic, " ").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"));
        rename(academic, "x".repeat(101)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("Size"));
        assertThat(nameOf(academic)).isEqualTo(base + "Học thuật");
    }

    @Test
    void rename_toOtherCategoryNameIgnoringCase_rejected_AC_CD_27() throws Exception {
        category(base + "Học thuật");
        UUID work = category(base + "Công việc");

        rename(work, base + "học thuật").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("DECK_CATEGORY_NAME_TAKEN"));
        assertThat(nameOf(work)).isEqualTo(base + "Công việc");
        assertThat(audits(work)).isEmpty();
    }

    @Test
    void rename_unknownCategory_notFound() throws Exception {
        rename(UUID.randomUUID(), base + "Mới").andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("DECK_CATEGORY_NOT_FOUND"));
    }
}
