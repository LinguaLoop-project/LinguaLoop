package com.lingualoop.backend.lesson.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
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
import com.lingualoop.backend.lesson.entity.Lesson;
import com.lingualoop.backend.lesson.entity.Sentence;
import com.lingualoop.backend.lesson.entity.Topic;
import com.lingualoop.backend.lesson.entity.UserLessonProgress;
import com.lingualoop.backend.lesson.enums.CefrLevel;
import com.lingualoop.backend.lesson.enums.LessonStatus;
import com.lingualoop.backend.lesson.repository.LessonProgressRepository;
import com.lingualoop.backend.lesson.repository.LessonRepository;
import com.lingualoop.backend.lesson.repository.SentenceRepository;
import com.lingualoop.backend.lesson.repository.TopicRepository;
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
    @Autowired private TopicRepository topics;
    @Autowired private LessonRepository lessons;
    @Autowired private SentenceRepository sentences;
    @Autowired private LessonProgressRepository progress;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private EntityManagerFactory entityManagerFactory;

    /** Mỗi test một tag riêng để lọc đúng dữ liệu của mình trên DB dùng chung. */
    private final String tag = UUID.randomUUID().toString().substring(0, 8);

    // ---------------------------------------------------------------- AC-LESSON-01..02

    @Test
    void search_returnsOnlyApprovedAndNotDeletedLessons_AC_LESSON_01() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        lesson(topic, "approved", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        lesson(topic, "draft", false, LessonStatus.DRAFT, CefrLevel.A1, 0);
        lesson(topic, "pending", false, LessonStatus.PENDING, CefrLevel.A1, 0);
        lesson(topic, "rejected", false, LessonStatus.REJECTED, CefrLevel.A1, 0);
        Lesson deleted = lesson(topic, "deleted", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        deleted.setDeletedAt(Instant.now());
        lessons.save(deleted);

        as(newUser(), get("/api/v1/lessons").param("q", tag))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].title").value(tag + " approved"));
    }

    @Test
    void search_filtersByTopicDifficultyAndFree_AC_LESSON_02() throws Exception {
        Topic a = topic("a", 1, LessonStatus.APPROVED);
        Topic b = topic("b", 2, LessonStatus.APPROVED);
        lesson(a, "a1-free", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        lesson(a, "b2-pro", true, LessonStatus.APPROVED, CefrLevel.B2, 0);
        lesson(b, "c1-free", false, LessonStatus.APPROVED, CefrLevel.C1, 0);
        UUID user = newUser();

        as(user, get("/api/v1/lessons").param("q", tag).param("topic", a.getSlug()))
                .andExpect(jsonPath("$.data.totalElements").value(2));
        as(user, get("/api/v1/lessons").param("q", tag).param("difficulty", "a1,C1"))
                .andExpect(jsonPath("$.data.totalElements").value(2));
        as(user, get("/api/v1/lessons").param("q", tag).param("free", "true"))
                .andExpect(jsonPath("$.data.totalElements").value(2));
        as(user, get("/api/v1/lessons").param("q", tag.toUpperCase()).param("topic", a.getSlug())
                .param("free", "true"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].difficulty").value("A1"));
    }

    // ---------------------------------------------------------------- AC-LESSON-03

    @Test
    void search_filtersByLearningState_AC_LESSON_03() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        Lesson todo = lesson(topic, "todo", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        Lesson doing = lesson(topic, "doing", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        Lesson done = lesson(topic, "done", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        UUID user = newUser();
        startLesson(user, doing, false);
        startLesson(user, done, true);

        as(user, get("/api/v1/lessons").param("q", tag).param("state", "todo"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].slug").value(todo.getSlug()));
        as(user, get("/api/v1/lessons").param("q", tag).param("state", "doing"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].slug").value(doing.getSlug()));
        as(user, get("/api/v1/lessons").param("q", tag).param("state", "DONE"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].slug").value(done.getSlug()));
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
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        for (int i = 0; i < 3; i++) {
            Lesson l = lesson(topic, "l" + i, false, LessonStatus.APPROVED, CefrLevel.A1, 0);
            sentence(l, 0, "one");
            sentence(l, 1, "two");
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

    // ---------------------------------------------------------------- AC-LESSON-05

    @Test
    void topics_areApprovedOnlyOrderedBySortOrderWithCounts_AC_LESSON_05() throws Exception {
        Topic second = topic("second", 20, LessonStatus.APPROVED);
        Topic first = topic("first", 10, LessonStatus.APPROVED);
        topic("hidden", 5, LessonStatus.DRAFT);
        lesson(first, "x", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        Lesson finished = lesson(first, "y", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        lesson(first, "draft", false, LessonStatus.DRAFT, CefrLevel.A1, 0);
        lesson(second, "z", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        UUID user = newUser();
        startLesson(user, finished, true);

        String json = as(user, get("/api/v1/topics")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(json).doesNotContain("hidden-" + tag);
        assertThat(json.indexOf("first-" + tag)).isPositive().isLessThan(json.indexOf("second-" + tag));

        as(user, get("/api/v1/topics/first-" + tag))
                .andExpect(jsonPath("$.data.topic.name").value("first " + tag))
                .andExpect(jsonPath("$.data.topic.totalLessons").value(2))
                .andExpect(jsonPath("$.data.topic.completedLessons").value(1))
                .andExpect(jsonPath("$.data.totalLessons").value(2));
    }

    @Test
    void topic_unapprovedOrUnknown_returns404_AC_LESSON_05() throws Exception {
        topic("draft", 1, LessonStatus.DRAFT);
        UUID user = newUser();

        as(user, get("/api/v1/topics/draft-" + tag)).andExpect(status().isNotFound());
        as(user, get("/api/v1/topics/missing-" + tag)).andExpect(status().isNotFound());
    }

    // ---------------------------------------------------------------- AC-LESSON-06..07

    @Test
    void detail_returnsTopicSentenceCountAndRelatedLessons_AC_LESSON_06() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        Lesson main = lesson(topic, "main", false, LessonStatus.APPROVED, CefrLevel.B1, 5);
        lesson(topic, "related", false, LessonStatus.APPROVED, CefrLevel.B1, 50);
        lesson(topic, "draft-related", false, LessonStatus.DRAFT, CefrLevel.B1, 99);
        sentence(main, 0, "hello");

        as(newUser(), get("/api/v1/lessons/" + main.getSlug()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.slug").value(main.getSlug()))
                .andExpect(jsonPath("$.data.difficulty").value("B1"))
                .andExpect(jsonPath("$.data.locked").value(false))
                .andExpect(jsonPath("$.data.sentenceCount").value(1))
                .andExpect(jsonPath("$.data.topic.slug").value(topic.getSlug()))
                .andExpect(jsonPath("$.data.relatedLessons.length()").value(1))
                .andExpect(jsonPath("$.data.relatedLessons[0].title").value(tag + " related"));
    }

    @Test
    void detail_reportsProgressFromAttemptsAndStudyTime_AC_LESSON_06() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        Lesson main = lesson(topic, "main", false, LessonStatus.APPROVED, CefrLevel.B1, 5);
        for (int i = 0; i < 4; i++) {
            sentence(main, i, "s" + i);
        }
        List<Sentence> all = sentences.findByLessonIdOrderBySortOrderAsc(main.getId());
        UUID user = newUser();
        startLesson(user, main, false);
        // shadowing: 2 trong 4 câu (câu đầu đọc hai lần vẫn chỉ tính một); nghe chép: 1 câu
        shadowingAttempt(user, all.get(0));
        shadowingAttempt(user, all.get(0));
        shadowingAttempt(user, all.get(1));
        jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode, submitted_text) VALUES (?, ?, 'dictation', 'x')",
                user, all.get(2).getId());
        jdbc.update("INSERT INTO user_lesson_mode_progress (user_id, lesson_id, mode, total_time_sec) VALUES (?, ?, 'shadowing', 100)",
                user, main.getId());
        jdbc.update("INSERT INTO user_lesson_mode_progress (user_id, lesson_id, mode, total_time_sec) VALUES (?, ?, 'dictation', 25)",
                user, main.getId());

        as(user, get("/api/v1/lessons/" + main.getSlug()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.progress.shadowingPercent").value(50))
                .andExpect(jsonPath("$.data.progress.dictationPercent").value(25))
                .andExpect(jsonPath("$.data.progress.studyTimeSec").value(125));

        // người khác không thấy tiến độ của người này
        as(newUser(), get("/api/v1/lessons/" + main.getSlug()))
                .andExpect(jsonPath("$.data.progress.shadowingPercent").value(0))
                .andExpect(jsonPath("$.data.progress.studyTimeSec").value(0));
    }

    @Test
    void detail_notApprovedDeletedOrUnknown_returns404_AC_LESSON_06() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        Lesson draft = lesson(topic, "draft", false, LessonStatus.DRAFT, CefrLevel.A1, 0);
        Lesson pending = lesson(topic, "pending", false, LessonStatus.PENDING, CefrLevel.A1, 0);
        Lesson deleted = lesson(topic, "deleted", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        deleted.setDeletedAt(Instant.now());
        lessons.save(deleted);
        UUID user = newUser();

        for (Lesson hidden : new Lesson[] {draft, pending, deleted}) {
            as(user, get("/api/v1/lessons/" + hidden.getSlug()))
                    .andExpect(status().isNotFound()).andExpect(jsonPath("$.code").value("NOT_FOUND"));
            as(user, get("/api/v1/lessons/" + hidden.getSlug() + "/sentences"))
                    .andExpect(status().isNotFound());
        }
        as(user, get("/api/v1/lessons/does-not-exist-" + tag)).andExpect(status().isNotFound());
    }

    @Test
    void sentences_areReturnedInOrder_AC_LESSON_07() throws Exception {
        Lesson l = lesson(topic("t", 1, LessonStatus.APPROVED), "s", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        sentence(l, 2, "third");
        sentence(l, 0, "first");
        sentence(l, 1, "second");

        as(newUser(), get("/api/v1/lessons/" + l.getSlug() + "/sentences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(3))
                .andExpect(jsonPath("$.data[0].text").value("first"))
                .andExpect(jsonPath("$.data[1].text").value("second"))
                .andExpect(jsonPath("$.data[2].text").value("third"))
                .andExpect(jsonPath("$.data[0].cefrLevel").value("A1"));
    }

    // ---------------------------------------------------------------- AC-LESSON-08

    @Test
    void proLesson_isLockedForFreeUser_AC_LESSON_08() throws Exception {
        Lesson pro = lesson(topic("t", 1, LessonStatus.APPROVED), "pro", true, LessonStatus.APPROVED, CefrLevel.B2, 0);
        sentence(pro, 0, "secret");
        UUID free = newUser();

        as(free, get("/api/v1/lessons/" + pro.getSlug()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.pro").value(true))
                .andExpect(jsonPath("$.data.locked").value(true));
        as(free, get("/api/v1/lessons/" + pro.getSlug() + "/sentences"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.code").value("LESSON_PRO_REQUIRED"));
        as(free, get("/api/v1/lessons").param("q", tag))
                .andExpect(jsonPath("$.data.items[0].locked").value(true));
    }

    @Test
    void proLesson_isOpenForProUser_AC_LESSON_08() throws Exception {
        Lesson pro = lesson(topic("t", 1, LessonStatus.APPROVED), "pro", true, LessonStatus.APPROVED, CefrLevel.B2, 0);
        sentence(pro, 0, "secret");
        UUID proUser = newUser();
        jdbc.update("INSERT INTO user_subscriptions (user_id, status, expires_at) "
                + "VALUES (?, 'active', now() + interval '30 days')", proUser);
        UUID expired = newUser();
        jdbc.update("INSERT INTO user_subscriptions (user_id, status, expires_at) "
                + "VALUES (?, 'active', now() - interval '1 day')", expired);

        as(proUser, get("/api/v1/lessons/" + pro.getSlug()))
                .andExpect(jsonPath("$.data.locked").value(false));
        as(proUser, get("/api/v1/lessons/" + pro.getSlug() + "/sentences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].text").value("secret"));
        as(expired, get("/api/v1/lessons/" + pro.getSlug() + "/sentences"))
                .andExpect(status().isForbidden());
    }

    // ---------------------------------------------------------------- AC-LESSON-09

    @Test
    void everyEndpoint_withoutToken_returns401_AC_LESSON_09() throws Exception {
        for (String path : new String[] {"/api/v1/lessons", "/api/v1/lessons/overview", "/api/v1/lessons/x",
                "/api/v1/lessons/x/sentences", "/api/v1/topics", "/api/v1/topics/x"}) {
            mockMvc.perform(get(path)).andExpect(status().isUnauthorized());
        }
    }

    // ---------------------------------------------------------------- AC-LESSON-10

    @Test
    void overview_returnsContinueLessonsAndTopRows_withBoundedQueryCount_AC_LESSON_10() throws Exception {
        UUID user = newUser();
        Lesson inProgress = null;
        for (int t = 0; t < 6; t++) {
            Topic topic = topic("t" + t, 100 + t, LessonStatus.APPROVED);
            for (int i = 0; i < 6; i++) {
                Lesson l = lesson(topic, "l" + t + "-" + i, i == 0, LessonStatus.APPROVED, CefrLevel.A2, 10 - i);
                sentence(l, 0, "s");
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
                .andExpect(jsonPath("$.data.continueLessons[0].slug").value(inProgress.getSlug()))
                .andReturn().getResponse().getContentAsString();
        long statements = stats.getPrepareStatementCount();

        assertThat(json).contains("\"topicRows\"");
        // topic, đếm bài, đếm hoàn thành, đang học, phổ biến, đếm câu, Pro: không phụ thuộc số chủ đề
        assertThat(statements).as("số câu SQL của overview").isLessThanOrEqualTo(10);
    }

    // ---------------------------------------------------------------- bổ sung ca biên theo AC

    @Test
    void search_matchesVietnameseTitleAndIgnoresBlankQueryAndUnknownLevels_AC_LESSON_02() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        Lesson vi = lesson(topic, "viet", false, LessonStatus.APPROVED, CefrLevel.A2, 0);
        vi.setTitleVi("Học tiếng Anh " + tag);
        lessons.save(vi);
        lesson(topic, "other", false, LessonStatus.APPROVED, CefrLevel.A2, 0);
        UUID user = newUser();

        as(user, get("/api/v1/lessons").param("q", "học tiếng anh " + tag))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].titleVi").value("Học tiếng Anh " + tag));
        // q rỗng và mức trình độ lạ không làm hỏng yêu cầu; chỉ còn các điều kiện hợp lệ
        as(user, get("/api/v1/lessons").param("q", "  ").param("topic", " ").param("difficulty", "Z9,  "))
                .andExpect(status().isOk());
        as(user, get("/api/v1/lessons").param("q", tag).param("difficulty", "Z9,a2"))
                .andExpect(jsonPath("$.data.totalElements").value(2));
        as(user, get("/api/v1/lessons").param("q", tag).param("difficulty", "C2"))
                .andExpect(jsonPath("$.data.totalElements").value(0))
                .andExpect(jsonPath("$.data.items.length()").value(0));
    }

    @Test
    void search_freeFalseKeepsProLessons_AC_LESSON_02() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        lesson(topic, "free", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        lesson(topic, "pro", true, LessonStatus.APPROVED, CefrLevel.A1, 0);

        as(newUser(), get("/api/v1/lessons").param("q", tag).param("free", "false"))
                .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    @Test
    void search_stateFilterIsPerUserAndKeepsProLockFlag_AC_LESSON_03() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        Lesson pro = lesson(topic, "pro", true, LessonStatus.APPROVED, CefrLevel.A1, 0);
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
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        lesson(topic, "only", false, LessonStatus.APPROVED, CefrLevel.A1, 0);

        as(newUser(), get("/api/v1/topics/" + topic.getSlug()))
                .andExpect(jsonPath("$.data.topic.totalLessons").value(1))
                .andExpect(jsonPath("$.data.topic.completedLessons").value(0))
                .andExpect(jsonPath("$.data.lessons.length()").value(0));
    }

    @Test
    void topics_withoutLessons_haveZeroCounts_AC_LESSON_05() throws Exception {
        Topic topic = topic("empty", 1, LessonStatus.APPROVED);

        String json = as(newUser(), get("/api/v1/topics")).andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        assertThat(json).contains("\"slug\":\"" + topic.getSlug() + "\"");
        as(newUser(), get("/api/v1/topics/" + topic.getSlug()))
                .andExpect(jsonPath("$.data.topic.totalLessons").value(0))
                .andExpect(jsonPath("$.data.topic.completedLessons").value(0));
    }

    @Test
    void detail_relatedLessonsExcludeSelfAndAreCappedAtThree_AC_LESSON_06() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        Lesson main = lesson(topic, "main", false, LessonStatus.APPROVED, CefrLevel.A1, 1);
        for (int i = 0; i < 5; i++) {
            lesson(topic, "rel" + i, false, LessonStatus.APPROVED, CefrLevel.A1, 100 - i);
        }

        as(newUser(), get("/api/v1/lessons/" + main.getSlug()))
                .andExpect(jsonPath("$.data.relatedLessons.length()").value(3))
                .andExpect(jsonPath("$.data.relatedLessons[0].title").value(tag + " rel0"));
    }

    @Test
    void detail_ofLessonWithoutRelatedOrSentences_hasEmptyCollections_AC_LESSON_06() throws Exception {
        Lesson alone = lesson(topic("solo", 1, LessonStatus.APPROVED), "alone", false,
                LessonStatus.APPROVED, CefrLevel.A1, 0);
        UUID user = newUser();

        as(user, get("/api/v1/lessons/" + alone.getSlug()))
                .andExpect(jsonPath("$.data.relatedLessons.length()").value(0))
                .andExpect(jsonPath("$.data.sentenceCount").value(0));
        as(user, get("/api/v1/lessons/" + alone.getSlug() + "/sentences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void overview_forNewUserHasNoContinueLessonsAndHidesEmptyOrUnapproved_AC_LESSON_10() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        Lesson pro = lesson(topic, "pro", true, LessonStatus.APPROVED, CefrLevel.A1, 9);
        lesson(topic, "draft", false, LessonStatus.DRAFT, CefrLevel.A1, 99);
        topic("nolessons", 2, LessonStatus.APPROVED);

        String json = as(newUser(), get("/api/v1/lessons/overview")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.continueLessons.length()").value(0))
                .andReturn().getResponse().getContentAsString();
        assertThat(json).contains("\"slug\":\"" + pro.getSlug() + "\"")
                .contains("\"locked\":true")
                .doesNotContain("nolessons-" + tag)
                .doesNotContain(tag + " draft");
    }

    @Test
    void overview_doesNotListCompletedLessonsAsContinue_AC_LESSON_10() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        Lesson done = lesson(topic, "done", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        UUID user = newUser();
        startLesson(user, done, true);

        as(user, get("/api/v1/lessons/overview"))
                .andExpect(jsonPath("$.data.continueLessons.length()").value(0));
    }

    // ---------------------------------------------------------------- AC-LESSON-13..14

    @Test
    void detail_reportsDictationPercentAsSentencesWithAResultOverAllSentences_AC_LESSON_13() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        Lesson l = lesson(topic, "pct", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        for (int i = 0; i < 3; i++) {
            sentence(l, i, "s" + i);
        }
        UUID user = newUser();
        var ids = sentences.findByLessonIdOrderBySortOrderAsc(l.getId());
        dictationAttempt(user, ids.get(0).getId(), "normal", false, false, null);
        dictationAttempt(user, ids.get(0).getId(), "normal", true, false, null);
        dictationAttempt(user, ids.get(1).getId(), "hard", false, true, null);

        as(user, get("/api/v1/lessons/" + l.getSlug()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.progress.dictationPercent").value(67))
                .andExpect(jsonPath("$.data.progress.shadowingPercent").value(0));
        as(newUser(), get("/api/v1/lessons/" + l.getSlug()))
                .andExpect(jsonPath("$.data.progress.dictationPercent").value(0));
    }

    @Test
    void search_reportsDictationPercentPerLessonOfTheCaller_AC_LESSON_13() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        Lesson done = lesson(topic, "done", false, LessonStatus.APPROVED, CefrLevel.A1, 2);
        Lesson fresh = lesson(topic, "fresh", false, LessonStatus.APPROVED, CefrLevel.A1, 1);
        Lesson empty = lesson(topic, "empty", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        sentence(done, 0, "a");
        sentence(fresh, 0, "b");
        UUID user = newUser();
        dictationAttempt(user, sentences.findByLessonIdOrderBySortOrderAsc(done.getId()).get(0).getId(), "normal",
                false, false, null);

        as(user, get("/api/v1/lessons").param("q", tag).param("sort", "viewCount,desc"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.items[?(@.slug == '" + done.getSlug() + "')].progress.dictationPercent")
                        .value(100))
                .andExpect(jsonPath("$.data.items[?(@.slug == '" + fresh.getSlug() + "')].progress.dictationPercent")
                        .value(0))
                .andExpect(jsonPath("$.data.items[?(@.slug == '" + empty.getSlug() + "')].progress.dictationPercent")
                        .value(0));
    }

    @Test
    void sentences_reportTheCallersBestScorePerModeOrNothing_AC_LESSON_14() throws Exception {
        Topic topic = topic("t", 1, LessonStatus.APPROVED);
        Lesson l = lesson(topic, "best", false, LessonStatus.APPROVED, CefrLevel.A1, 0);
        sentence(l, 0, "scored");
        sentence(l, 1, "untouched");
        UUID user = newUser();
        UUID scored = sentences.findByLessonIdOrderBySortOrderAsc(l.getId()).get(0).getId();
        dictationAttempt(user, scored, "normal", false, false, "40.00");
        dictationAttempt(user, scored, "hard", false, false, "86.60");
        shadowingAttempt(user, sentences.findByLessonIdOrderBySortOrderAsc(l.getId()).get(0));

        as(user, get("/api/v1/lessons/" + l.getSlug() + "/sentences"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].myBestScore.dictation").value(87))
                .andExpect(jsonPath("$.data[0].myBestScore.shadowing").value(80))
                .andExpect(jsonPath("$.data[1].myBestScore.dictation").doesNotExist())
                .andExpect(jsonPath("$.data[1].myBestScore.shadowing").doesNotExist());
        as(newUser(), get("/api/v1/lessons/" + l.getSlug() + "/sentences"))
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

    private Topic topic(String name, int sortOrder, LessonStatus status) {
        Topic t = new Topic();
        t.setSlug(name + "-" + tag);
        t.setName(name + " " + tag);
        t.setSortOrder(sortOrder);
        t.setStatus(status);
        return topics.save(t);
    }

    private Lesson lesson(Topic topic, String name, boolean pro, LessonStatus status, CefrLevel level, int views) {
        Lesson l = new Lesson();
        l.setTopic(topic);
        l.setSlug(name + "-" + tag);
        l.setTitle(tag + " " + name);
        l.setPro(pro);
        l.setStatus(status);
        l.setDifficulty(level);
        l.setViewCount(views);
        return lessons.save(l);
    }

    private void sentence(Lesson lesson, int order, String text) {
        Sentence s = new Sentence();
        s.setLesson(lesson);
        s.setSortOrder(order);
        s.setText(text);
        s.setStartMs(order * 1000);
        s.setEndMs(order * 1000 + 900);
        s.setCefrLevel(CefrLevel.A1);
        sentences.save(s);
    }

    private void dictationAttempt(UUID userId, UUID sentenceId, String level, boolean retry, boolean gaveUp,
            String score) {
        jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode, level, is_retry, gave_up, score) "
                + "VALUES (?, ?, 'dictation', ?, ?, ?, ?::numeric)", userId, sentenceId, level, retry, gaveUp, score);
    }

    private void shadowingAttempt(UUID userId, Sentence sentence) {
        jdbc.update("INSERT INTO sentence_attempts (user_id, sentence_id, mode, provider, score) "
                + "VALUES (?, ?, 'shadowing', 'azure', 80)", userId, sentence.getId());
    }

    private void startLesson(UUID userId, Lesson lesson, boolean completed) {
        UserLessonProgress p = new UserLessonProgress();
        p.setUserId(userId);
        p.setLessonId(lesson.getId());
        if (completed) {
            p.setCompletedAt(Instant.now().plusSeconds(1));
        }
        progress.save(p);
    }
}
