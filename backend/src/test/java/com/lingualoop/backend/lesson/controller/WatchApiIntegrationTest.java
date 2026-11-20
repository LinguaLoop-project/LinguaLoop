package com.lingualoop.backend.lesson.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
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

/** Học thụ động (UC-TC-04) trên Postgres thật: luồng video, thích video và lưu câu. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class WatchApiIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private LessonFixtures fixtures;
    @Autowired private JdbcTemplate jdbc;

    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    // ---------------------------------------------------------------- AC-TC-25

    @Test
    void feed_listsOnlyPublishedShortLibraryLessonsWithLinesInTimeOrder_AC_TC_25() throws Exception {
        UUID topic = fixtures.topic("watch " + tag);
        UUID shown = shortLesson(topic, "shown", false);
        UUID second = fixtures.sentence(shown, 2, "Second line.", "Câu hai.");
        UUID first = fixtures.sentence(shown, 0, "First line.", "Câu một.");
        UUID draft = fixtures.lesson(topic, tag + " draft", false, "draft", "A1", 0, false);
        shorten(draft);
        fixtures.sentence(draft, 0, "x");
        UUID deleted = fixtures.lesson(topic, tag + " deleted", false, "published", "A1", 0, true);
        shorten(deleted);
        fixtures.sentence(deleted, 0, "x");
        UUID longLesson = fixtures.publishedLesson(topic, tag + " long");
        fixtures.sentence(longLesson, 0, "x");
        UUID silent = shortLesson(topic, "no lines", false);
        UUID personal = shortLesson(topic, "personal", false);
        jdbc.update("UPDATE lessons SET kind = 'personal' WHERE id = ?", personal);
        fixtures.sentence(personal, 0, "x");
        UUID user = newUser();

        List<Map<String, Object>> items = allItems(user, "s1");
        List<UUID> ids = ids(items);

        assertThat(ids).contains(shown).doesNotContain(draft, deleted, longLesson, silent, personal);
        Map<String, Object> item = items.get(ids.indexOf(shown));
        assertThat(item.get("title")).isEqualTo(tag + " shown");
        assertThat(item.get("topicName")).isEqualTo("watch " + tag);
        assertThat(item.get("durationSec")).isEqualTo(120);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> lines = (List<Map<String, Object>>) item.get("sentences");
        assertThat(lines).extracting(l -> UUID.fromString((String) l.get("id"))).containsExactly(first, second);
        assertThat(lines.get(0)).containsEntry("textVi", "Câu một.").containsEntry("startMs", 0)
                .containsEntry("endMs", 900).containsEntry("saved", false);
    }

    @Test
    void feed_keepsTheSameOrderForASeed_putsTheStartLessonFirst_andUnpracticedLessonsBeforePracticed_AC_TC_25()
            throws Exception {
        UUID topic = fixtures.topic("watch " + tag);
        List<UUID> lessons = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            UUID lesson = shortLesson(topic, "l" + i, false);
            fixtures.sentence(lesson, 0, "Line " + i);
            lessons.add(lesson);
        }
        UUID practiced = lessons.get(0);
        UUID user = newUser();
        jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode, total_score) "
                + "SELECT ?, id, 'shadowing', 80 FROM sentences WHERE lesson_id = ?", user, practiced);

        List<UUID> once = ids(allItems(user, "same"));
        assertThat(ids(allItems(user, "same"))).isEqualTo(once);
        assertThat(once).containsAll(lessons);
        assertThat(once.indexOf(practiced)).isGreaterThan(once.indexOf(lessons.get(1)));

        UUID start = lessons.get(5);
        UUID longStart = fixtures.publishedLesson(topic, tag + " long start");
        fixtures.sentence(longStart, 0, "x");
        as(user, get("/api/v1/watch/feed").param("seed", "same").param("start", start.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[0].lessonId").value(start.toString()));
        as(user, get("/api/v1/watch/feed").param("seed", "same").param("start", longStart.toString()))
                .andExpect(jsonPath("$.data.items[0].lessonId").value(longStart.toString()));
        as(user, get("/api/v1/watch/feed").param("page", "-1")).andExpect(status().isBadRequest());
    }

    // ---------------------------------------------------------------- AC-TC-27

    @Test
    void like_thenLikeAgain_thenUnlikeTwice_countsOnlyOneLike_AC_TC_27() throws Exception {
        UUID lesson = shortLesson(fixtures.topic("watch " + tag), "liked", false);
        fixtures.sentence(lesson, 0, "x");
        UUID other = newUser();
        jdbc.update("INSERT INTO lesson_likes (user_id, lesson_id) VALUES (?, ?)", other, lesson);
        UUID user = newUser();

        as(user, put("/api/v1/watch/lessons/{id}/like", lesson))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.liked").value(true))
                .andExpect(jsonPath("$.data.likeCount").value(2));
        as(user, put("/api/v1/watch/lessons/{id}/like", lesson))
                .andExpect(jsonPath("$.data.likeCount").value(2));
        Map<String, Object> item = find(allItems(user, "x"), lesson);
        assertThat(item).containsEntry("liked", true).containsEntry("likeCount", 2);

        as(user, delete("/api/v1/watch/lessons/{id}/like", lesson))
                .andExpect(jsonPath("$.data.liked").value(false))
                .andExpect(jsonPath("$.data.likeCount").value(1));
        as(user, delete("/api/v1/watch/lessons/{id}/like", lesson))
                .andExpect(jsonPath("$.data.likeCount").value(1));
    }

    @Test
    void like_aDraftOrMissingLesson_isNotFound_AC_TC_27() throws Exception {
        UUID draft = fixtures.lesson(fixtures.topic("watch " + tag), tag + " draft", false, "draft", "A1", 0, false);
        UUID user = newUser();

        as(user, put("/api/v1/watch/lessons/{id}/like", draft)).andExpect(status().isNotFound())
                .andExpect(jsonPath("$.code").value("LESSON_NOT_FOUND"));
        as(user, put("/api/v1/watch/lessons/{id}/like", UUID.randomUUID())).andExpect(status().isNotFound());
    }

    // ---------------------------------------------------------------- AC-TC-29

    @Test
    void saveSentence_withoutAnyAttempt_addsItToShadowingReview_andSavingAgainUnsavesIt_AC_TC_29() throws Exception {
        UUID lesson = shortLesson(fixtures.topic("watch " + tag), "save", false);
        UUID sentence = fixtures.sentence(lesson, 0, "Save me.");
        UUID user = newUser();

        as(user, put("/api/v1/watch/sentences/{id}/saved", sentence))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.saved").value(true));
        as(user, put("/api/v1/watch/sentences/{id}/saved", sentence)).andExpect(status().isOk());
        as(user, get("/api/v1/review/shadowing/sentences"))
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].sentenceId").value(sentence.toString()))
                .andExpect(jsonPath("$.data[0].reason").value("manual"));
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> lines = (List<Map<String, Object>>) find(allItems(user, "x"), lesson)
                .get("sentences");
        assertThat(lines.get(0)).containsEntry("saved", true);

        as(user, delete("/api/v1/watch/sentences/{id}/saved", sentence))
                .andExpect(jsonPath("$.data.saved").value(false));
        as(user, get("/api/v1/review/shadowing/sentences")).andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void saveSentence_ofADraftLessonOrADeletedSentence_isNotFound_AC_TC_29() throws Exception {
        UUID topic = fixtures.topic("watch " + tag);
        UUID draft = fixtures.lesson(topic, tag + " draft", false, "draft", "A1", 0, false);
        UUID inDraft = fixtures.sentence(draft, 0, "x");
        UUID lesson = shortLesson(topic, "ok", false);
        UUID removed = fixtures.sentence(lesson, 0, "x");
        jdbc.update("UPDATE sentences SET deleted_at = now() WHERE id = ?", removed);
        UUID user = newUser();

        as(user, put("/api/v1/watch/sentences/{id}/saved", inDraft)).andExpect(status().isNotFound());
        as(user, put("/api/v1/watch/sentences/{id}/saved", removed)).andExpect(status().isNotFound());
    }

    // ---------------------------------------------------------------- AC-TC-32

    @Test
    void freeLearners_doNotGetProVideos_andAreToldSomeAreHidden_proLearnersGetThem_AC_TC_32() throws Exception {
        UUID topic = fixtures.topic("watch " + tag);
        UUID proLesson = shortLesson(topic, "pro", true);
        UUID proSentence = fixtures.sentence(proLesson, 0, "Pro line.");
        UUID free = newUser();
        UUID pro = newUser();
        fixtures.grantPro(pro);

        assertThat(ids(allItems(free, "x"))).doesNotContain(proLesson);
        as(free, get("/api/v1/watch/feed")).andExpect(jsonPath("$.data.proHidden").value(true));
        as(free, get("/api/v1/watch/feed").param("start", proLesson.toString()))
                .andExpect(status().isOk());
        assertThat(ids(allItems(free, "x"))).doesNotContain(proLesson);
        as(free, put("/api/v1/watch/lessons/{id}/like", proLesson)).andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));
        as(free, put("/api/v1/watch/sentences/{id}/saved", proSentence)).andExpect(status().isForbidden());

        assertThat(ids(allItems(pro, "x"))).contains(proLesson);
        as(pro, get("/api/v1/watch/feed")).andExpect(jsonPath("$.data.proHidden").value(false));
        as(pro, put("/api/v1/watch/sentences/{id}/saved", proSentence)).andExpect(status().isOk());
    }

    @Test
    void anonymousIs401_andTeachersAre403_AC_TC_32() throws Exception {
        mockMvc.perform(get("/api/v1/watch/feed")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/v1/watch/feed").header(HttpHeaders.AUTHORIZATION, "Bearer "
                + jwtTokenService.issueAccessToken(newTeacher(), Role.TEACHER, UUID.randomUUID()).token()))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- helpers

    private UUID shortLesson(UUID topic, String name, boolean pro) {
        UUID id = fixtures.lesson(topic, tag + " " + name, pro, "published", "A2", 0, false);
        shorten(id);
        return id;
    }

    private void shorten(UUID lessonId) {
        jdbc.update("UPDATE lessons SET duration_sec = 120 WHERE id = ?", lessonId);
    }

    /** Mọi video của luồng theo {@code seed}, đi hết các trang. */
    private List<Map<String, Object>> allItems(UUID userId, String seed) throws Exception {
        List<Map<String, Object>> all = new ArrayList<>();
        for (int page = 0; page < 200; page++) {
            String body = as(userId, get("/api/v1/watch/feed").param("seed", seed).param("page", "" + page))
                    .andExpect(status().isOk())
                    .andReturn().getResponse().getContentAsString();
            List<Map<String, Object>> items = JsonPath.read(body, "$.data.items");
            all.addAll(items);
            if (!(Boolean) JsonPath.read(body, "$.data.hasMore")) {
                return all;
            }
        }
        throw new AssertionError("luồng không kết thúc");
    }

    private static List<UUID> ids(List<Map<String, Object>> items) {
        List<UUID> ids = items.stream().map(i -> UUID.fromString((String) i.get("lessonId"))).toList();
        assertThat(Set.copyOf(ids)).hasSameSizeAs(ids);
        return ids;
    }

    private static Map<String, Object> find(List<Map<String, Object>> items, UUID lessonId) {
        return items.stream().filter(i -> lessonId.toString().equals(i.get("lessonId"))).findFirst().orElseThrow();
    }

    private ResultActions as(UUID userId, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer "
                + jwtTokenService.issueAccessToken(userId, Role.STUDENT, UUID.randomUUID()).token()));
    }

    private UUID newUser() {
        return userAccountService.createLocal("watch-" + UUID.randomUUID() + "@x.com", "Lâm", "bcrypt-hash").id();
    }

    /** Vai trò trong token phải khớp vai trò trong cơ sở dữ liệu, nếu không token bị từ chối (BR-QT-04). */
    private UUID newTeacher() {
        UUID teacher = newUser();
        jdbc.update("UPDATE users SET role = 'teacher' WHERE id = ?", teacher);
        return teacher;
    }
}
