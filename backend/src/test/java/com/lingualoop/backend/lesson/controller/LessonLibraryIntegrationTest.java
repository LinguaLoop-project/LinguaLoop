package com.lingualoop.backend.lesson.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.SessionFactory;
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

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.user.dto.UserAccountView;
import com.lingualoop.backend.user.service.UserAccountService;

import jakarta.persistence.EntityManagerFactory;

/** Chạy trên Postgres thật: query JPQL/native, view và specification đều được thực thi. */
@SpringBootTest(properties = "spring.jpa.properties.hibernate.generate_statistics=true")
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class LessonLibraryIntegrationTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private JwtTokenService jwtTokenService;
    @Autowired private UserAccountService userAccountService;
    @Autowired private LessonFixtures fixtures;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private EntityManagerFactory entityManagerFactory;

    /** Mỗi test một tag riêng để lọc đúng dữ liệu của mình trên DB dùng chung. */
    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    // ---------------------------------------------------------------- AC-LESSON-01..02

    @Test
    void search_returnsOnlyPublishedAndNotDeletedLessons_AC_LESSON_01() throws Exception {
        UUID topic = topic("t");
        lesson(topic, "published", false, "published", "A1", 0);
        lesson(topic, "draft", false, "draft", "A1", 0);
        fixtures.lesson(topic, tag + " deleted", false, "published", "A1", 0, true);

        as(newUser(), get("/api/v1/lessons").param("q", tag))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].title").value(tag + " published"));
    }

    @Test
    void search_filtersByTopicCefrLevelAndFree_AC_LESSON_02() throws Exception {
        UUID a = topic("a");
        UUID b = topic("b");
        lesson(a, "a1-free", false, "published", "A1", 0);
        lesson(a, "b2-pro", true, "published", "B2", 0);
        lesson(b, "c1-free", false, "published", "C1", 0);
        UUID user = newUser();

        as(user, get("/api/v1/lessons").param("q", tag).param("topicId", a.toString()))
                .andExpect(jsonPath("$.data.totalElements").value(2));
        as(user, get("/api/v1/lessons").param("q", tag).param("cefrLevel", "a1,C1"))
                .andExpect(jsonPath("$.data.totalElements").value(2));
        as(user, get("/api/v1/lessons").param("q", tag).param("free", "true"))
                .andExpect(jsonPath("$.data.totalElements").value(2));
        as(user, get("/api/v1/lessons").param("q", tag.toUpperCase()).param("topicId", a.toString())
                .param("free", "true"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].cefrLevel").value("A1"));
    }

    // ---------------------------------------------------------------- AC-LESSON-03

    @Test
    void search_filtersByLearningState_AC_LESSON_03() throws Exception {
        UUID topic = topic("t");
        UUID todo = lesson(topic, "todo", false, "published", "A1", 0);
        UUID doing = lesson(topic, "doing", false, "published", "A1", 0);
        UUID done = lesson(topic, "done", false, "published", "A1", 0);
        UUID user = newUser();
        startLesson(user, doing, false);
        startLesson(user, done, true);

        as(user, get("/api/v1/lessons").param("q", tag).param("state", "todo"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(todo.toString()));
        as(user, get("/api/v1/lessons").param("q", tag).param("state", "doing"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(doing.toString()));
        as(user, get("/api/v1/lessons").param("q", tag).param("state", "DONE"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].id").value(done.toString()));
        // tiến độ của người khác không ảnh hưởng
        as(newUser(), get("/api/v1/lessons").param("q", tag).param("state", "todo"))
                .andExpect(jsonPath("$.data.totalElements").value(3));
    }

    @Test
    void search_unknownState_returns400_AC_LESSON_03() throws Exception {
        as(newUser(), get("/api/v1/lessons").param("state", "finished"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
    }

    // ---------------------------------------------------------------- AC-LESSON-04

    @Test
    void search_usesPageResponseShapeAndSentenceCounts_AC_LESSON_04() throws Exception {
        UUID topic = topic("t");
        for (int i = 0; i < 3; i++) {
            UUID l = lesson(topic, "l" + i, false, "published", "A1", 0);
            fixtures.sentence(l, 0, "one");
            fixtures.sentence(l, 1, "two");
        }

        as(newUser(), get("/api/v1/lessons").param("q", tag).param("size", "2").param("page", "1")
                .param("sort", "title,asc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items.length()").value(1))
                .andExpect(jsonPath("$.data.page").value(1))
                .andExpect(jsonPath("$.data.size").value(2))
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.totalPages").value(2))
                .andExpect(jsonPath("$.data.items[0].sentenceCount").value(2))
                .andExpect(jsonPath("$.data.content").doesNotExist())
                .andExpect(jsonPath("$.data.pageable").doesNotExist());
    }

    @Test
    void search_buildsThumbnailFromYoutubeId_AC_LESSON_04() throws Exception {
        UUID l = lesson(topic("t"), "thumb", false, "published", "A1", 0);
        String youtubeId = jdbc.queryForObject("SELECT youtube_id FROM lessons WHERE id = ?", String.class, l);

        as(newUser(), get("/api/v1/lessons").param("q", tag))
                .andExpect(jsonPath("$.data.items[0].youtubeId").value(youtubeId))
                .andExpect(jsonPath("$.data.items[0].thumbnailUrl")
                        .value("https://img.youtube.com/vi/" + youtubeId + "/hqdefault.jpg"));
    }

    // ---------------------------------------------------------------- AC-LESSON-05

    @Test
    void topics_areOrderedByNameWithCounts_AC_LESSON_05() throws Exception {
        UUID second = topic("second");
        UUID first = topic("first");
        lesson(first, "x", false, "published", "A1", 0);
        UUID finished = lesson(first, "y", false, "published", "A1", 0);
        lesson(first, "draft", false, "draft", "A1", 0);
        lesson(second, "z", false, "published", "A1", 0);
        UUID user = newUser();
        startLesson(user, finished, true);

        String json = as(user, get("/api/v1/topics")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(json.indexOf("first " + tag)).isPositive().isLessThan(json.indexOf("second " + tag));

        as(user, get("/api/v1/topics/" + first))
                .andExpect(jsonPath("$.data.topic.name").value("first " + tag))
                .andExpect(jsonPath("$.data.topic.totalLessons").value(2))
                .andExpect(jsonPath("$.data.topic.completedLessons").value(1))
                .andExpect(jsonPath("$.data.totalLessons").value(2));
    }

    @Test
    void topic_unknown_returns404_AC_LESSON_05() throws Exception {
        as(newUser(), get("/api/v1/topics/" + UUID.randomUUID())).andExpect(status().isNotFound());
    }

    // ---------------------------------------------------------------- AC-LESSON-06..07

    @Test
    void detail_returnsTopicSentenceCountAndRelatedLessons_AC_LESSON_06() throws Exception {
        UUID topic = topic("t");
        UUID main = lesson(topic, "main", false, "published", "B1", 5);
        lesson(topic, "related", false, "published", "B1", 50);
        lesson(topic, "draft-related", false, "draft", "B1", 99);
        fixtures.sentence(main, 0, "hello");

        as(newUser(), get("/api/v1/lessons/" + main))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(main.toString()))
                .andExpect(jsonPath("$.data.cefrLevel").value("B1"))
                .andExpect(jsonPath("$.data.locked").value(false))
                .andExpect(jsonPath("$.data.sentenceCount").value(1))
                .andExpect(jsonPath("$.data.topic.id").value(topic.toString()))
                .andExpect(jsonPath("$.data.relatedLessons.length()").value(1))
                .andExpect(jsonPath("$.data.relatedLessons[0].title").value(tag + " related"));
    }

    @Test
    void detail_reportsProgressFromAttempts_AC_LESSON_06() throws Exception {
        UUID main = lesson(topic("t"), "main", false, "published", "B1", 5);
        List<UUID> all = new ArrayList<>();
        for (int i = 0; i < 4; i++) {
            all.add(fixtures.sentence(main, i, "s" + i));
        }
        UUID user = newUser();
        // shadowing: 2 trong 4 câu (câu đầu đọc hai lần vẫn chỉ tính một); nghe chép: 1 câu
        shadowingAttempt(user, all.get(0));
        shadowingAttempt(user, all.get(0));
        shadowingAttempt(user, all.get(1));
        dictationAttempt(user, all.get(2), "normal", false, false, "70");

        as(user, get("/api/v1/lessons/" + main))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.progress.shadowingPercent").value(50))
                .andExpect(jsonPath("$.data.progress.dictationPercent").value(25));

        // người khác không thấy tiến độ của người này
        as(newUser(), get("/api/v1/lessons/" + main))
                .andExpect(jsonPath("$.data.progress.shadowingPercent").value(0));
    }

    @Test
    void detail_draftDeletedOrUnknown_returns404_AC_LESSON_06() throws Exception {
        UUID topic = topic("t");
        UUID draft = lesson(topic, "draft", false, "draft", "A1", 0);
        fixtures.sentence(draft, 0, "hidden");
        UUID deleted = fixtures.lesson(topic, tag + " deleted", false, "published", "A1", 0, true);
        UUID user = newUser();

        for (UUID hidden : new UUID[] {draft, deleted}) {
            as(user, get("/api/v1/lessons/" + hidden))
                    .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NOT_FOUND"));
            as(user, get("/api/v1/lessons/" + hidden + "/sentences"))
                    .andExpect(status().isNotFound());
        }
        as(user, get("/api/v1/lessons/" + UUID.randomUUID())).andExpect(status().isNotFound());
    }

    @Test
    void detail_personalLesson_isNotInTheLibrary_AC_LESSON_06() throws Exception {
        UUID personal = lesson(topic("t"), "personal", false, "published", "A1", 0);
        jdbc.update("UPDATE lessons SET kind = 'personal' WHERE id = ?", personal);

        as(newUser(), get("/api/v1/lessons/" + personal)).andExpect(status().isNotFound());
        as(newUser(), get("/api/v1/lessons").param("q", tag))
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void sentences_areReturnedInTimeOrderWithoutDeletedOnes_AC_LESSON_07() throws Exception {
        UUID l = lesson(topic("t"), "s", false, "published", "A1", 0);
        fixtures.sentence(l, 2, "third");
        fixtures.sentence(l, 0, "first");
        fixtures.sentence(l, 1, "second");
        UUID removed = fixtures.sentence(l, 5, "removed");
        jdbc.update("UPDATE sentences SET deleted_at = now() WHERE id = ?", removed);

        as(newUser(), get("/api/v1/lessons/" + l + "/sentences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[0].textEn").value("first"))
                .andExpect(jsonPath("$.data[1].textEn").value("second"))
                .andExpect(jsonPath("$.data[2].textEn").value("third"));
    }

    // ---------------------------------------------------------------- AC-LESSON-08

    @Test
    void proLesson_isLockedForFreeUser_AC_LESSON_08() throws Exception {
        UUID pro = lesson(topic("t"), "pro", true, "published", "B2", 0);
        fixtures.sentence(pro, 0, "secret");
        UUID free = newUser();

        as(free, get("/api/v1/lessons/" + pro))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pro").value(true))
                .andExpect(jsonPath("$.data.locked").value(true));
        as(free, get("/api/v1/lessons/" + pro + "/sentences"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));
        as(free, get("/api/v1/lessons").param("q", tag))
                .andExpect(jsonPath("$.data.items[0].locked").value(true));
    }

    @Test
    void proLesson_isOpenForProUser_AC_LESSON_08() throws Exception {
        UUID pro = lesson(topic("t"), "pro", true, "published", "B2", 0);
        fixtures.sentence(pro, 0, "secret");
        UUID proUser = newUser();
        fixtures.grantPro(proUser);
        UUID expired = newUser();
        fixtures.grantExpiredPro(expired);

        as(proUser, get("/api/v1/lessons/" + pro))
                .andExpect(jsonPath("$.data.locked").value(false));
        as(proUser, get("/api/v1/lessons/" + pro + "/sentences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].textEn").value("secret"));
        as(expired, get("/api/v1/lessons/" + pro + "/sentences"))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- AC-LESSON-09

    @Test
    void everyEndpoint_withoutToken_returns401_AC_LESSON_09() throws Exception {
        String id = UUID.randomUUID().toString();
        for (String path : new String[] {"/api/v1/lessons", "/api/v1/lessons/overview", "/api/v1/lessons/" + id,
                "/api/v1/lessons/" + id + "/sentences", "/api/v1/topics", "/api/v1/topics/" + id}) {
            mockMvc.perform(get(path)).andExpect(status().isUnauthorized());
        }
    }

    // ---------------------------------------------------------------- AC-LESSON-10

    @Test
    void overview_returnsContinueLessonsAndTopRows_withBoundedQueryCount_AC_LESSON_10() throws Exception {
        UUID user = newUser();
        UUID inProgress = null;
        for (int t = 0; t < 6; t++) {
            UUID topic = topic("t" + t);
            for (int i = 0; i < 6; i++) {
                UUID l = lesson(topic, "l" + t + "-" + i, i == 0, "published", "A2", 10 - i);
                fixtures.sentence(l, 0, "s");
                if (t == 0 && i == 1) {
                    inProgress = l;
                }
            }
        }
        startLesson(user, inProgress, false);

        var stats = entityManagerFactory.unwrap(SessionFactory.class).getStatistics();
        stats.clear();
        String json = as(user, get("/api/v1/lessons/overview")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.continueLessons.length()").value(1))
                .andExpect(jsonPath("$.data.continueLessons[0].id").value(inProgress.toString()))
                .andReturn().getResponse().getContentAsString();
        long statements = stats.getPrepareStatementCount();

        assertThat(json).contains("\"topicRows\"");
        // số câu SQL không phụ thuộc số chủ đề
        assertThat(statements).as("số câu SQL của overview").isLessThanOrEqualTo(14);
    }

    // ---------------------------------------------------------------- bổ sung ca biên theo AC

    @Test
    void search_ignoresBlankQueryAndUnknownLevels_AC_LESSON_02() throws Exception {
        UUID topic = topic("t");
        lesson(topic, "viet", false, "published", "A2", 0);
        lesson(topic, "other", false, "published", "A2", 0);
        UUID user = newUser();

        // q rỗng và mức trình độ lạ không làm hỏng yêu cầu; chỉ còn các điều kiện hợp lệ
        as(user, get("/api/v1/lessons").param("q", "  ").param("cefrLevel", "Z9,  "))
                .andExpect(status().isOk());
        as(user, get("/api/v1/lessons").param("q", tag).param("cefrLevel", "Z9,a2"))
                .andExpect(jsonPath("$.data.totalElements").value(2));
        as(user, get("/api/v1/lessons").param("q", tag).param("cefrLevel", "C2"))
                .andExpect(jsonPath("$.data.totalElements").value(0))
                .andExpect(jsonPath("$.data.items.length()").value(0));
    }

    @Test
    void search_freeFalseKeepsProLessons_AC_LESSON_02() throws Exception {
        UUID topic = topic("t");
        lesson(topic, "free", false, "published", "A1", 0);
        lesson(topic, "pro", true, "published", "A1", 0);

        as(newUser(), get("/api/v1/lessons").param("q", tag).param("free", "false"))
                .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    void search_stateFilterIsPerUserAndKeepsProLockFlag_AC_LESSON_03() throws Exception {
        UUID pro = lesson(topic("t"), "pro", true, "published", "A1", 0);
        UUID user = newUser();
        UUID other = newUser();
        startLesson(user, pro, false);

        as(user, get("/api/v1/lessons").param("q", tag).param("state", "doing"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].locked").value(true));
        as(other, get("/api/v1/lessons").param("q", tag).param("state", "doing"))
                .andExpect(jsonPath("$.data.totalElements").value(0));
        as(other, get("/api/v1/lessons").param("q", tag).param("state", "done"))
                .andExpect(jsonPath("$.data.totalElements").value(0));
    }

    @Test
    void topic_withoutCompletedLessons_reportsZeroProgress_AC_LESSON_05() throws Exception {
        UUID topic = topic("t");
        lesson(topic, "only", false, "published", "A1", 0);

        as(newUser(), get("/api/v1/topics/" + topic))
                .andExpect(jsonPath("$.data.topic.totalLessons").value(1))
                .andExpect(jsonPath("$.data.topic.completedLessons").value(0))
                .andExpect(jsonPath("$.data.lessons.length()").value(0));
    }

    @Test
    void topics_withoutLessons_haveZeroCounts_AC_LESSON_05() throws Exception {
        UUID topic = topic("empty");

        String json = as(newUser(), get("/api/v1/topics")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(json).contains("\"id\":\"" + topic + "\"");
        as(newUser(), get("/api/v1/topics/" + topic))
                .andExpect(jsonPath("$.data.topic.totalLessons").value(0))
                .andExpect(jsonPath("$.data.topic.completedLessons").value(0));
    }

    @Test
    void detail_relatedLessonsExcludeSelfAndAreCappedAtThree_AC_LESSON_06() throws Exception {
        UUID topic = topic("t");
        UUID main = lesson(topic, "main", false, "published", "A1", 1);
        for (int i = 0; i < 5; i++) {
            lesson(topic, "rel" + i, false, "published", "A1", 100 - i);
        }

        as(newUser(), get("/api/v1/lessons/" + main))
                .andExpect(jsonPath("$.data.relatedLessons.length()").value(3))
                .andExpect(jsonPath("$.data.relatedLessons[0].title").value(tag + " rel0"));
    }

    @Test
    void detail_ofLessonWithoutRelatedOrSentences_hasEmptyCollections_AC_LESSON_06() throws Exception {
        UUID alone = lesson(topic("solo"), "alone", false, "published", "A1", 0);
        UUID user = newUser();

        as(user, get("/api/v1/lessons/" + alone))
                .andExpect(jsonPath("$.data.relatedLessons.length()").value(0))
                .andExpect(jsonPath("$.data.sentenceCount").value(0));
        as(user, get("/api/v1/lessons/" + alone + "/sentences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void overview_forNewUserHasNoContinueLessonsAndHidesEmptyOrDraft_AC_LESSON_10() throws Exception {
        UUID topic = topic("t");
        UUID pro = lesson(topic, "pro", true, "published", "A1", 9);
        lesson(topic, "draft", false, "draft", "A1", 99);
        topic("nolessons");

        String json = as(newUser(), get("/api/v1/lessons/overview")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.continueLessons.length()").value(0))
                .andReturn().getResponse().getContentAsString();
        assertThat(json).contains("\"id\":\"" + pro + "\"")
                .contains("\"locked\":true")
                .doesNotContain("nolessons " + tag)
                .doesNotContain(tag + " draft");
    }

    @Test
    void overview_doesNotListCompletedLessonsAsContinue_AC_LESSON_10() throws Exception {
        UUID done = lesson(topic("t"), "done", false, "published", "A1", 0);
        UUID user = newUser();
        startLesson(user, done, true);

        as(user, get("/api/v1/lessons/overview"))
                .andExpect(jsonPath("$.data.continueLessons.length()").value(0));
    }

    // ---------------------------------------------------------------- AC-LESSON-13..14

    @Test
    void detail_reportsDictationPercentAsSentencesWithAResultOverAllSentences_AC_LESSON_13() throws Exception {
        UUID l = lesson(topic("t"), "pct", false, "published", "A1", 0);
        List<UUID> ids = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            ids.add(fixtures.sentence(l, i, "s" + i));
        }
        UUID user = newUser();
        dictationAttempt(user, ids.get(0), "normal", false, false, "50");
        dictationAttempt(user, ids.get(0), "normal", true, false, "50");
        dictationAttempt(user, ids.get(1), "hard", false, true, "0");

        as(user, get("/api/v1/lessons/" + l))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.progress.dictationPercent").value(67))
                .andExpect(jsonPath("$.data.progress.shadowingPercent").value(0));
        as(newUser(), get("/api/v1/lessons/" + l))
                .andExpect(jsonPath("$.data.progress.dictationPercent").value(0));
    }

    @Test
    void search_reportsDictationPercentPerLessonOfTheCaller_AC_LESSON_13() throws Exception {
        UUID topic = topic("t");
        UUID done = lesson(topic, "done", false, "published", "A1", 2);
        UUID fresh = lesson(topic, "fresh", false, "published", "A1", 1);
        UUID empty = lesson(topic, "empty", false, "published", "A1", 0);
        UUID doneSentence = fixtures.sentence(done, 0, "a");
        fixtures.sentence(fresh, 0, "b");
        UUID user = newUser();
        dictationAttempt(user, doneSentence, "normal", false, false, "90");

        as(user, get("/api/v1/lessons").param("q", tag).param("sort", "viewCount,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[?(@.id == '" + done + "')].progress.dictationPercent").value(100))
                .andExpect(jsonPath("$.data.items[?(@.id == '" + fresh + "')].progress.dictationPercent").value(0))
                .andExpect(jsonPath("$.data.items[?(@.id == '" + empty + "')].progress.dictationPercent").value(0));
    }

    @Test
    void sentences_reportTheCallersBestScorePerModeOrNothing_AC_LESSON_14() throws Exception {
        UUID l = lesson(topic("t"), "best", false, "published", "A1", 0);
        UUID scored = fixtures.sentence(l, 0, "scored");
        fixtures.sentence(l, 1, "untouched");
        UUID user = newUser();
        dictationAttempt(user, scored, "normal", false, false, "40.00");
        dictationAttempt(user, scored, "hard", false, false, "86.60");
        shadowingAttempt(user, scored);

        as(user, get("/api/v1/lessons/" + l + "/sentences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].myBestScore.dictation").value(87))
                .andExpect(jsonPath("$.data[0].myBestScore.shadowing").value(80))
                .andExpect(jsonPath("$.data[1].myBestScore.dictation").doesNotExist())
                .andExpect(jsonPath("$.data[1].myBestScore.shadowing").doesNotExist());
        as(newUser(), get("/api/v1/lessons/" + l + "/sentences"))
                .andExpect(jsonPath("$.data[0].myBestScore.dictation").doesNotExist())
                .andExpect(jsonPath("$.data[0].myBestScore.shadowing").doesNotExist());
    }

    // ---------------------------------------------------------------- fixtures

    private ResultActions as(UUID userId, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer "
                + jwtTokenService.issueAccessToken(userId, Role.STUDENT, UUID.randomUUID()).token()));
    }

    private UUID newUser() {
        UserAccountView account = userAccountService.createLocal(
                "lesson-" + UUID.randomUUID() + "@x.com", "Lâm", "bcrypt-hash");
        return account.id();
    }

    private UUID topic(String name) {
        return fixtures.topic(name + " " + tag);
    }

    private UUID lesson(UUID topic, String name, boolean pro, String status, String cefrLevel, int views) {
        return fixtures.lesson(topic, tag + " " + name, pro, status, cefrLevel, views, false);
    }

    private void dictationAttempt(UUID userId, UUID sentenceId, String level, boolean retry, boolean gaveUp,
            String score) {
        jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode, level, is_retry, gave_up, total_score) "
                + "VALUES (?, ?, 'dictation', ?, ?, ?, ?::numeric)", userId, sentenceId, level, retry, gaveUp, score);
    }

    private void shadowingAttempt(UUID userId, UUID sentenceId) {
        jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode, total_score) "
                + "VALUES (?, ?, 'shadowing', 80)", userId, sentenceId);
    }

    /**
     * Cho người dùng bắt đầu bài bằng lượt nghe chép: đang học = làm câu đầu (bài có ít nhất hai câu); hoàn thành =
     * làm mọi câu. Bài chưa có câu thì thêm hai câu.
     */
    private void startLesson(UUID userId, UUID lessonId, boolean completed) {
        List<UUID> ids = new ArrayList<>(jdbc.queryForList(
                "SELECT id FROM sentences WHERE lesson_id = ? AND deleted_at IS NULL ORDER BY start_ms",
                UUID.class, lessonId));
        if (ids.isEmpty()) {
            ids.add(fixtures.sentence(lessonId, 0, "a"));
        }
        if (ids.size() == 1 && !completed) {
            ids.add(fixtures.sentence(lessonId, 90, "extra"));
        }
        for (UUID sentenceId : completed ? ids : ids.subList(0, 1)) {
            dictationAttempt(userId, sentenceId, "normal", false, false, "70");
        }
    }
}
