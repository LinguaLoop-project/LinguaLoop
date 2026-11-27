package com.lingualoop.backend.lesson.controller;

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
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.lesson.service.AdminTopicService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.AdminUserTestData;

import jakarta.persistence.EntityManagerFactory;

/**
 * Quản lý chủ đề (UC-CD-01 đến 03). Bảng chủ đề dùng chung giữa các test nên mỗi test đặt tên với tiền tố {@link #base}
 * và tìm theo tiền tố đó. AC-CD-03 (hệ thống chưa có chủ đề nào) không dựng được trên cơ sở dữ liệu dùng chung; phía
 * máy chủ trả danh sách rỗng giống AC-CD-04. AC-CD-06, 09, 11, 14 (hủy, mất kết nối) thuộc phía giao diện.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, AdminUserTestData.class, LessonFixtures.class})
class AdminTopicApiIntegrationTest {

    private static final String TOPICS = "/api/v1/admin/topics";

    @Autowired private MockMvc mockMvc;
    @Autowired private AdminUserTestData data;
    @Autowired private LessonFixtures lessons;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private AdminTopicService service;
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

    private ResultActions list(String q, Boolean visible) throws Exception {
        MockHttpServletRequestBuilder request = get(TOPICS).param("q", q);
        if (visible != null) {
            request.param("visible", visible.toString());
        }
        return asAdmin(request);
    }

    private ResultActions create(String name) throws Exception {
        return asAdmin(post(TOPICS).contentType(MediaType.APPLICATION_JSON).content(nameBody(name)));
    }

    private ResultActions rename(UUID id, String name) throws Exception {
        return asAdmin(put(TOPICS + "/" + id).contentType(MediaType.APPLICATION_JSON).content(nameBody(name)));
    }

    private static String nameBody(String name) {
        return name == null ? "{\"name\":null}" : "{\"name\":\"" + name + "\"}";
    }

    private void publishedLessons(UUID topic, int count) {
        for (int i = 0; i < count; i++) {
            lessons.publishedLesson(topic, base + UUID.randomUUID());
        }
    }

    private String nameOf(UUID topic) {
        return jdbc.queryForObject("SELECT name FROM topics WHERE id = ?", String.class, topic);
    }

    private List<Map<String, Object>> audits(UUID topic) {
        return jdbc.queryForList("""
                SELECT action, target_name, changes::text AS changes FROM audit_logs
                WHERE target_type = 'topic' AND target_id = ? ORDER BY id""", topic);
    }

    private static String json(ResultActions result) throws Exception {
        return result.andReturn().getResponse().getContentAsString();
    }

    // ---------------------------------------------------------------- UC-CD-01

    @Test
    void list_inDisplayOrderWithPublishedCountsAndVisibility_AC_CD_01() throws Exception {
        UUID travel = lessons.topic(base + "Du lịch");
        lessons.topic(base + "Phỏng vấn");
        lessons.topic(base + "Ẩm thực");
        publishedLessons(travel, 5);
        lessons.lesson(travel, base + "Nháp 1", false, "draft", "B1", 0, false);
        lessons.lesson(travel, base + "Nháp 2", false, "draft", "B1", 0, false);
        lessons.lesson(travel, base + "Đã xóa", false, "published", "B1", 0, true);

        String body = json(list(base, null).andExpect(status().isOk()));

        assertThat(JsonPath.<List<String>>read(body, "$.data[*].name"))
                .containsExactly(base + "Du lịch", base + "Phỏng vấn", base + "Ẩm thực");
        assertThat(JsonPath.<List<Integer>>read(body, "$.data[*].publishedLessons")).containsExactly(5, 0, 0);
        assertThat(JsonPath.<List<Boolean>>read(body, "$.data[*].visible")).containsExactly(true, false, false);
        assertThat(JsonPath.<List<String>>read(body, "$.data[*].updatedAt")).allSatisfy(d -> assertThat(d).isNotBlank());
    }

    @Test
    void list_searchIgnoresCaseAndFiltersByVisibility_AC_CD_02() throws Exception {
        UUID travel = lessons.topic(base + "Du lịch");
        lessons.topic(base + "Du học");
        publishedLessons(travel, 1);

        list(base + "du", false).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].name").value(base + "Du học"));
        list(base + "DU", true).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].name").value(base + "Du lịch"));
    }

    @Test
    void list_noMatch_returnsEmpty_AC_CD_04() throws Exception {
        lessons.topic(base + "Du lịch");

        list(base + "zzz", null).andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void list_wildcardCharactersAreLiteral() throws Exception {
        lessons.topic(base + "Du lịch");

        list(base + "%", null).andExpect(status().isOk()).andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void list_countsInOneQuery_noNPlusOne() {
        for (int i = 0; i < 5; i++) {
            publishedLessons(lessons.topic(base + "Chủ đề " + i), 2);
        }
        Statistics stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.setStatisticsEnabled(true);
        stats.clear();
        try {
            assertThat(service.list(base, null)).hasSize(5).allSatisfy(t -> assertThat(t.publishedLessons()).isEqualTo(2));
            assertThat(stats.getPrepareStatementCount()).isEqualTo(1);
        } finally {
            stats.setStatisticsEnabled(false);
        }
    }

    @Test
    void list_byTeacher_isForbidden() throws Exception {
        UUID teacher = data.teacher("Giáo viên");
        mockMvc.perform(get(TOPICS).header(HttpHeaders.AUTHORIZATION, data.bearer(teacher, Role.TEACHER)))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- UC-CD-02

    @Test
    void create_addsHiddenTopicAtEndAndLogs_AC_CD_05() throws Exception {
        lessons.topic(base + "Du lịch");
        lessons.topic(base + "Phỏng vấn");
        lessons.topic(base + "Ẩm thực");

        String body = json(create(base + "Sức khỏe").andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value(base + "Sức khỏe"))
                .andExpect(jsonPath("$.data.publishedLessons").value(0))
                .andExpect(jsonPath("$.data.visible").value(false)));
        UUID id = UUID.fromString(JsonPath.read(body, "$.data.id"));

        assertThat(JsonPath.<List<String>>read(json(list(base, null)), "$.data[*].name"))
                .containsExactly(base + "Du lịch", base + "Phỏng vấn", base + "Ẩm thực", base + "Sức khỏe");
        UUID teacher = data.teacher("Giáo viên");
        mockMvc.perform(get("/api/v1/topics").header(HttpHeaders.AUTHORIZATION, data.bearer(teacher, Role.TEACHER)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[?(@.id == '" + id + "')].name").value(base + "Sức khỏe"));
        assertThat(audits(id)).singleElement().satisfies(a -> {
            assertThat(a).containsEntry("action", "create").containsEntry("target_name", base + "Sức khỏe");
            assertThat((String) a.get("changes")).contains("\"new\": \"" + base + "Sức khỏe\"");
        });
    }

    @Test
    void create_trimsName() throws Exception {
        create("  " + base + "Thể thao  ").andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.name").value(base + "Thể thao"));
    }

    @Test
    void create_blankOrTooLong_rejected_AC_CD_07() throws Exception {
        create("  ").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"))
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
        create(null).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[0].field").value("name"));
        String tooLong = base + "x".repeat(101 - base.length());
        create(tooLong).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("Size"));
        create(base + "x".repeat(100 - base.length())).andExpect(status().isCreated());

        list(base, null).andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void create_duplicateNameIgnoringCase_rejected_AC_CD_08() throws Exception {
        lessons.topic(base + "Du lịch");

        create(base + "du LỊCH").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TOPIC_NAME_TAKEN"))
                .andExpect(jsonPath("$.message").value("Tên chủ đề đã tồn tại"));
        list(base, null).andExpect(jsonPath("$.data.length()").value(1));
    }

    @Test
    void create_byTeacher_isForbidden() throws Exception {
        UUID teacher = data.teacher("Giáo viên");
        mockMvc.perform(post(TOPICS).header(HttpHeaders.AUTHORIZATION, data.bearer(teacher, Role.TEACHER))
                .contentType(MediaType.APPLICATION_JSON).content(nameBody(base + "Mới")))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- UC-CD-03

    @Test
    void rename_keepsLessonsAndOrder_refreshesUpdatedAt_logsOldAndNew_AC_CD_10() throws Exception {
        UUID travel = lessons.topic(base + "Du lịch");
        lessons.topic(base + "Phỏng vấn");
        publishedLessons(travel, 5);
        Instant old = Instant.parse("2026-01-01T00:00:00Z");
        jdbc.update("UPDATE topics SET updated_at = ? WHERE id = ?", Timestamp.from(old), travel);

        String body = json(rename(travel, base + "Du lịch và khám phá").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(travel.toString()))
                .andExpect(jsonPath("$.data.name").value(base + "Du lịch và khám phá"))
                .andExpect(jsonPath("$.data.publishedLessons").value(5))
                .andExpect(jsonPath("$.data.visible").value(true)));
        assertThat(Instant.parse(JsonPath.read(body, "$.data.updatedAt"))).isAfter(old);

        assertThat(JsonPath.<List<String>>read(json(list(base, null)), "$.data[*].name"))
                .containsExactly(base + "Du lịch và khám phá", base + "Phỏng vấn");
        mockMvc.perform(get("/api/v1/topics/" + travel)
                .header(HttpHeaders.AUTHORIZATION, data.bearer(data.user(Role.STUDENT, "Học viên"), Role.STUDENT)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.topic.name").value(base + "Du lịch và khám phá"))
                .andExpect(jsonPath("$.data.totalLessons").value(5));
        assertThat(audits(travel)).singleElement().satisfies(a -> {
            assertThat(a).containsEntry("action", "update").containsEntry("target_name", base + "Du lịch và khám phá");
            assertThat((String) a.get("changes")).contains("\"old\": \"" + base + "Du lịch\"")
                    .contains("\"new\": \"" + base + "Du lịch và khám phá\"");
        });
    }

    @Test
    void rename_changeOnlyCaseOfOwnName_allowed() throws Exception {
        UUID travel = lessons.topic(base + "du lịch");

        rename(travel, base + "Du Lịch").andExpect(status().isOk())
                .andExpect(jsonPath("$.data.name").value(base + "Du Lịch"));
    }

    @Test
    void rename_sameName_noChangeNoLog() throws Exception {
        UUID travel = lessons.topic(base + "Du lịch");

        rename(travel, base + "Du lịch").andExpect(status().isOk());
        assertThat(audits(travel)).isEmpty();
    }

    @Test
    void rename_blankOrTooLong_keepsOldName_AC_CD_12() throws Exception {
        UUID travel = lessons.topic(base + "Du lịch");

        rename(travel, "").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].code").value("NotBlank"));
        rename(travel, "x".repeat(101)).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[0].code").value("Size"));
        assertThat(nameOf(travel)).isEqualTo(base + "Du lịch");
    }

    @Test
    void rename_toOtherTopicNameIgnoringCase_rejected_AC_CD_13() throws Exception {
        lessons.topic(base + "Du lịch");
        UUID interview = lessons.topic(base + "Phỏng vấn");

        rename(interview, base + "du lịch").andExpect(status().isConflict())
                .andExpect(jsonPath("$.code").value("TOPIC_NAME_TAKEN"));
        assertThat(nameOf(interview)).isEqualTo(base + "Phỏng vấn");
        assertThat(audits(interview)).isEmpty();
    }

    @Test
    void rename_unknownTopic_notFound() throws Exception {
        rename(UUID.randomUUID(), base + "Mới").andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("TOPIC_NOT_FOUND"));
    }
}
