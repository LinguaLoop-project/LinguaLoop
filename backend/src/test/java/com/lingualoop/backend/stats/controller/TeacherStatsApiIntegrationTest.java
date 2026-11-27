package com.lingualoop.backend.stats.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.AdminUserTestData;

/**
 * Quyền và tham số mặc định của API thống kê nội dung giáo viên (BR-TN-01, BR-TN-03). Số liệu kiểm ở test của service.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import({ TestcontainersConfiguration.class, AdminUserTestData.class })
class TeacherStatsApiIntegrationTest {

    private static final String STATS = "/api/v1/teacher/stats";

    @Autowired private MockMvc mockMvc;
    @Autowired private AdminUserTestData data;
    @Autowired private JdbcTemplate jdbc;

    @Test
    void teacher_getsOverviewLessonAndDeckWithDefaultThirtyDays() throws Exception {
        UUID teacher = data.teacher("GV");
        String bearer = data.bearer(teacher, Role.TEACHER);

        mockMvc.perform(get(STATS + "/overview").header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.period").value("D30"))
                .andExpect(jsonPath("$.data.openReports").value(0))
                .andExpect(jsonPath("$.data.computedAt").exists())
                .andExpect(jsonPath("$.data.daily.series.review.length()").value(30));
        mockMvc.perform(get(STATS + "/lessons/" + lesson(teacher)).param("period", "D7")
                .header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.daily.days.length()").value(7))
                .andExpect(jsonPath("$.data.hardestDictation.length()").value(0));
        mockMvc.perform(get(STATS + "/decks/" + deck(teacher)).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.period").value("D30"))
                .andExpect(jsonPath("$.data.groups.length()").value(1))
                .andExpect(jsonPath("$.data.daily.series.reviews.length()").value(30));
    }

    @Test
    void otherTeachersContent_isForbidden_AC_TN_12_AC_TN_20() throws Exception {
        UUID owner = data.teacher("GV A");
        String other = data.bearer(data.teacher("GV B"), Role.TEACHER);

        mockMvc.perform(get(STATS + "/lessons/" + lesson(owner)).header(HttpHeaders.AUTHORIZATION, other))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("FORBIDDEN"));
        mockMvc.perform(get(STATS + "/decks/" + deck(owner)).header(HttpHeaders.AUTHORIZATION, other))
                .andExpect(status().isForbidden());
    }

    @Test
    void missingContent_isNotFound_AC_TN_13_AC_TN_21() throws Exception {
        String bearer = data.bearer(data.teacher("GV"), Role.TEACHER);

        mockMvc.perform(get(STATS + "/lessons/" + UUID.randomUUID()).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("LESSON_NOT_FOUND"));
        mockMvc.perform(get(STATS + "/decks/" + UUID.randomUUID()).header(HttpHeaders.AUTHORIZATION, bearer))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("VOCAB_DECK_NOT_FOUND"));
    }

    @Test
    void adminAndStudent_areForbidden_BR_TN_01() throws Exception {
        mockMvc.perform(get(STATS + "/overview").header(HttpHeaders.AUTHORIZATION,
                data.bearer(data.admin(), Role.ADMIN)))
                .andExpect(status().isForbidden());
        mockMvc.perform(get(STATS + "/overview").header(HttpHeaders.AUTHORIZATION,
                data.bearer(data.user(Role.STUDENT, "HV"), Role.STUDENT)))
                .andExpect(status().isForbidden());
    }

    @Test
    void invalidPeriod_isRejected() throws Exception {
        mockMvc.perform(get(STATS + "/overview").param("period", "D14")
                .header(HttpHeaders.AUTHORIZATION, data.bearer(data.teacher("GV"), Role.TEACHER)))
                .andExpect(status().isBadRequest());
    }

    private UUID lesson(UUID owner) {
        UUID topic = jdbc.queryForObject("INSERT INTO topics (name) VALUES (?) RETURNING id", UUID.class,
                "tn-api-" + UUID.randomUUID());
        UUID lesson = jdbc.queryForObject("""
                INSERT INTO lessons (owner_id, kind, topic_id, title, youtube_id, duration_sec, cefr_level)
                VALUES (?, 'library', ?, ?, ?, 600, 'B1') RETURNING id""", UUID.class, owner, topic,
                "Bài " + UUID.randomUUID(), UUID.randomUUID().toString().substring(0, 11));
        jdbc.update("INSERT INTO sentences (lesson_id, text_en, start_ms, end_ms) VALUES (?, 'Hi', 0, 2000)", lesson);
        return lesson;
    }

    private UUID deck(UUID owner) {
        UUID deck = jdbc.queryForObject("""
                INSERT INTO vocab_decks (owner_id, kind, name) VALUES (?, 'library', ?) RETURNING id""", UUID.class,
                owner, "Bộ " + UUID.randomUUID());
        jdbc.update("INSERT INTO vocab_groups (deck_id, name) VALUES (?, 'G')", deck);
        return deck;
    }
}
