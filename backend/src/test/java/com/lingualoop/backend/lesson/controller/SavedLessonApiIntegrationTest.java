package com.lingualoop.backend.lesson.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
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
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;

import com.jayway.jsonpath.JsonPath;
import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.service.UserAccountService;

/** Bài đã lưu (UC-TC-05) trên Postgres thật. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SavedLessonApiIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private LessonFixtures fixtures;
    @Autowired private JdbcTemplate jdbc;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    // ---------------------------------------------------------------- AC-TC-34

    @Test
    void save_thenSaveAgain_thenUnsaveTwice_keepsOneRowAndShowsInDetailAndFeed_AC_TC_34() throws Exception {
        UUID lesson = lesson("one", false, "published");
        fixtures.sentence(lesson, 0, "Hello there.");
        jdbc.update("UPDATE lessons SET duration_sec = 90 WHERE id = ?", lesson);
        UUID user = newUser();

        as(user, get("/api/v1/lessons/{id}", lesson)).andExpect(jsonPath("$.data.saved").value(false));
        as(user, put("/api/v1/lessons/{id}/saved", lesson))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.saved").value(true));
        Object firstTime = jdbc.queryForObject(
                "SELECT created_at FROM lesson_saves WHERE user_id = ? AND lesson_id = ?", Object.class, user, lesson);
        as(user, put("/api/v1/lessons/{id}/saved", lesson)).andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM lesson_saves WHERE user_id = ?", Integer.class, user))
                .isEqualTo(1);
        assertThat(jdbc.queryForObject("SELECT created_at FROM lesson_saves WHERE user_id = ? AND lesson_id = ?",
                Object.class, user, lesson)).isEqualTo(firstTime);

        as(user, get("/api/v1/lessons/{id}", lesson)).andExpect(jsonPath("$.data.saved").value(true));
        String feed = as(user, get("/api/v1/watch/feed").param("start", lesson.toString()))
                .andReturn().getResponse().getContentAsString();
        assertThat((Boolean) JsonPath.read(feed, "$.data.items[0].saved")).isTrue();

        as(user, delete("/api/v1/lessons/{id}/saved", lesson))
                .andExpect(status().isOk()).andExpect(jsonPath("$.data.saved").value(false));
        as(user, delete("/api/v1/lessons/{id}/saved", lesson)).andExpect(status().isOk());
        as(user, get("/api/v1/lessons/{id}", lesson)).andExpect(jsonPath("$.data.saved").value(false));
    }

    // ---------------------------------------------------------------- AC-TC-35

    @Test
    void save_aDraftMissingOrProLesson_isRefused_AC_TC_35() throws Exception {
        UUID draft = lesson("draft", false, "draft");
        UUID pro = lesson("pro", true, "published");
        UUID free = newUser();
        UUID proUser = newUser();
        fixtures.grantPro(proUser);

        as(free, put("/api/v1/lessons/{id}/saved", draft)).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("LESSON_NOT_FOUND"));
        as(free, put("/api/v1/lessons/{id}/saved", UUID.randomUUID())).andExpect(status().isNotFound());
        as(free, put("/api/v1/lessons/{id}/saved", pro)).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));
        as(proUser, put("/api/v1/lessons/{id}/saved", pro)).andExpect(status().isOk());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM lesson_saves WHERE user_id = ?", Integer.class, free))
                .isZero();
    }

    // ---------------------------------------------------------------- AC-TC-36

    @Test
    void list_showsNewestFirst_canReverse_pagesBy12_andCarriesProgress_AC_TC_36() throws Exception {
        UUID user = newUser();
        UUID[] lessons = new UUID[14];
        for (int i = 0; i < lessons.length; i++) {
            lessons[i] = lesson("l" + i, false, "published");
            fixtures.sentence(lessons[i], 0, "a");
            fixtures.sentence(lessons[i], 1, "b");
            jdbc.update("INSERT INTO lesson_saves (user_id, lesson_id, created_at) "
                    + "VALUES (?, ?, now() - make_interval(mins => ?))", user, lessons[i], lessons.length - i);
        }
        attempt(user, jdbc.queryForObject("SELECT id FROM sentences WHERE lesson_id = ? AND text_en = 'a'",
                UUID.class, lessons[13]), "dictation");

        as(user, get("/api/v1/lessons/saved"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(14))
                .andExpect(jsonPath("$.data.items.length()").value(12))
                .andExpect(jsonPath("$.data.items[0].id").value(lessons[13].toString()))
                .andExpect(jsonPath("$.data.items[0].sentenceCount").value(2))
                .andExpect(jsonPath("$.data.items[0].progress.dictationPercent").value(50))
                .andExpect(jsonPath("$.data.items[0].progress.shadowingPercent").value(0))
                .andExpect(jsonPath("$.data.items[0].availability").value("available"));
        as(user, get("/api/v1/lessons/saved").param("page", "1"))
                .andExpect(jsonPath("$.data.items.length()").value(2));
        as(user, get("/api/v1/lessons/saved").param("sort", "saved_asc"))
                .andExpect(jsonPath("$.data.items[0].id").value(lessons[0].toString()));
    }

    // ---------------------------------------------------------------- AC-TC-37

    @Test
    void list_filtersByTitleAndByLearningState_AC_TC_37() throws Exception {
        UUID user = newUser();
        UUID todo = lesson("alpha todo", false, "published");
        UUID doing = lesson("beta doing", false, "published");
        UUID done = lesson("gamma done", false, "published");
        UUID aDoing = fixtures.sentence(doing, 0, "x");
        fixtures.sentence(doing, 1, "y");
        UUID aDone = fixtures.sentence(done, 0, "x");
        for (UUID id : List.of(todo, doing, done)) {
            jdbc.update("INSERT INTO lesson_saves (user_id, lesson_id) VALUES (?, ?)", user, id);
        }
        fixtures.sentence(todo, 0, "x");
        attempt(user, aDoing, "dictation");
        attempt(user, aDone, "dictation");
        attempt(user, aDone, "shadowing");

        as(user, get("/api/v1/lessons/saved").param("q", "BETA"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(doing.toString()));
        assertThat(ids(user, "todo")).containsExactly(todo.toString());
        assertThat(ids(user, "doing")).containsExactly(doing.toString());
        assertThat(ids(user, "done")).containsExactly(done.toString());
        as(user, get("/api/v1/lessons/saved").param("state", "nope")).andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------- AC-TC-38

    @Test
    void list_keepsLessonsThatWereUnpublishedOrBecameProOnly_andTheyCanBeUnsaved_AC_TC_38() throws Exception {
        UUID user = newUser();
        UUID gone = lesson("gone", false, "published");
        UUID removed = lesson("removed", false, "published");
        UUID pro = lesson("pro", true, "published");
        for (UUID id : List.of(gone, removed, pro)) {
            jdbc.update("INSERT INTO lesson_saves (user_id, lesson_id) VALUES (?, ?)", user, id);
        }
        jdbc.update("UPDATE lessons SET status = 'draft' WHERE id = ?", gone);
        jdbc.update("UPDATE lessons SET deleted_at = now() WHERE id = ?", removed);

        String body = as(user, get("/api/v1/lessons/saved")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andReturn().getResponse().getContentAsString();
        assertThat(availability(body, gone)).isEqualTo("unavailable");
        assertThat(availability(body, removed)).isEqualTo("unavailable");
        assertThat(availability(body, pro)).isEqualTo("pro_required");

        as(user, delete("/api/v1/lessons/{id}/saved", gone)).andExpect(status().isOk());
        as(user, get("/api/v1/lessons/saved")).andExpect(jsonPath("$.data.totalElements").value(2));
    }

    // ---------------------------------------------------------------- AC-TC-39

    @Test
    void list_isEmptyForANewLearner_isPrivate_andRefusesAnonymousAndTeachers_AC_TC_39() throws Exception {
        UUID lesson = lesson("mine", false, "published");
        UUID owner = newUser();
        UUID other = newUser();
        jdbc.update("INSERT INTO lesson_saves (user_id, lesson_id) VALUES (?, ?)", owner, lesson);

        as(other, get("/api/v1/lessons/saved"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0))
                .andExpect(jsonPath("$.data.items.length()").value(0));
        mockMvc.perform(get("/api/v1/lessons/saved")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/lessons/saved").header(HttpHeaders.AUTHORIZATION, "Bearer "
                + jwtTokenService.issueAccessToken(other, Role.TEACHER, UUID.randomUUID()).token()))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- helpers

    private UUID lesson(String name, boolean pro, String status) {
        return fixtures.lesson(fixtures.topic("saved " + name + " " + tag), tag + " " + name, pro, status, "A2", 0, false);
    }

    private List<String> ids(UUID user, String state) throws Exception {
        String body = as(user, get("/api/v1/lessons/saved").param("state", state)).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$.data.items[*].id");
    }

    private static String availability(String body, UUID lessonId) {
        List<String> found = JsonPath.read(body, "$.data.items[?(@.id=='" + lessonId + "')].availability");
        return found.get(0);
    }

    private void attempt(UUID userId, UUID sentenceId, String mode) {
        if ("dictation".equals(mode)) {
            jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode, level, is_retry, gave_up, "
                    + "total_score) VALUES (?, ?, 'dictation', 'easy', false, false, 80)", userId, sentenceId);
        } else {
            jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode, total_score) "
                    + "VALUES (?, ?, 'shadowing', 80)", userId, sentenceId);
        }
    }

    private ResultActions as(UUID userId, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer "
                + jwtTokenService.issueAccessToken(userId, Role.STUDENT, UUID.randomUUID()).token()));
    }

    private UUID newUser() {
        return userAccountService.createLocal("saved-" + UUID.randomUUID() + "@x.com", "Lâm", "bcrypt-hash").id();
    }
}
