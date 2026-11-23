package com.lingualoop.backend.stats;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.sql.Timestamp;
import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.ArrayList;
import java.util.Arrays;
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

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.dictation.DictationTestData;
import com.lingualoop.backend.lesson.LessonFixtures;
import com.lingualoop.backend.practice.AttemptTestData;
import com.lingualoop.backend.security.JwtTokenService;
import com.lingualoop.backend.security.Role;
import com.lingualoop.backend.vocab.VocabTestData;

/** Thống kê học tập (UC-TH-01, UC-TH-02, UC-TH-03) trên Postgres thật. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class StatsApiIntegrationTest {

    private static final String OVERVIEW = "/api/v1/stats/overview";
    private static final String HISTORY = "/api/v1/stats/history";
    private static final String PRONUNCIATION = "/api/v1/stats/pronunciation";
    /** Múi giờ mặc định của học viên mới (users.timezone). */
    private static final ZoneId ZONE = ZoneId.of("Asia/Ho_Chi_Minh");

    @Autowired private MockMvc mockMvc;
    @Autowired private JdbcTemplate jdbc;
    @Autowired private DictationTestData users;
    @Autowired private AttemptTestData attempts;
    @Autowired private VocabTestData vocab;
    @Autowired private LessonFixtures fixtures;
    @Autowired private JwtTokenService jwtTokenService;

    private final String base = "st" + UUID.randomUUID().toString().replace("-", "").substring(0, 8);
    private int seq;

    // ---------------------------------------------------------------- UC-TH-01: tổng quan

    @Test
    void overview_defaultsTo30Days_countsOnlyOwnDataAndStartedDecks_AC_TH_01() throws Exception {
        UUID user = users.newUser();
        UUID other = users.newUser();
        UUID lesson = lesson(false, "published");
        UUID s1 = sentence(lesson, 0);
        UUID s2 = sentence(lesson, 1);
        UUID s3 = sentence(lesson, 2);
        dictation(user, s1, at(1), 80);
        dictation(user, s2, at(2), 70);
        shadowing(user, s1, at(1), 60);
        dictation(other, s3, at(1), 90);   // của học viên khác, không được lẫn vào

        UUID deck = vocab.deck(base + "d1", false);
        List<UUID> cards = vocab.fill(deck, 1, 4, base + "a");
        vocab.progress(user, cards.get(0), 1, 1, "now() + interval '1 day'");     // Đang học
        vocab.progress(user, cards.get(1), 3, 6, "now() + interval '6 days'");    // Đang ôn
        vocab.progress(user, cards.get(2), 5, 30, "now() + interval '30 days'");  // Đã thuộc
        // thẻ thứ tư chưa có tiến độ nhưng cùng bộ đã bắt đầu: Mới
        UUID untouched = vocab.deck(base + "d2", false);
        vocab.fill(untouched, 1, 5, base + "b");                                   // bộ chưa bắt đầu: không tính
        reviewLog(user, cards.get(0), null, true, at(1));
        reviewLog(user, cards.get(1), null, true, at(1));
        reviewLog(user, cards.get(2), null, true, at(1));
        reviewLog(user, cards.get(0), null, false, at(1));

        as(user, get(OVERVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.range").value("30d"))
                .andExpect(jsonPath("$.data.sentences.total").value(2))
                .andExpect(jsonPath("$.data.sentences.dictation").value(2))
                .andExpect(jsonPath("$.data.sentences.shadowing").value(1))
                .andExpect(jsonPath("$.data.lessons.doing").value(1))
                .andExpect(jsonPath("$.data.lessons.done").value(0))
                .andExpect(jsonPath("$.data.vocab.cards.newCount").value(1))
                .andExpect(jsonPath("$.data.vocab.cards.learning").value(1))
                .andExpect(jsonPath("$.data.vocab.cards.reviewing").value(1))
                .andExpect(jsonPath("$.data.vocab.cards.mastered").value(1))
                .andExpect(jsonPath("$.data.vocab.answered").value(4))
                .andExpect(jsonPath("$.data.vocab.correct").value(3))
                .andExpect(jsonPath("$.data.vocab.accuracyPercent").value(75));
        as(other, get(OVERVIEW)).andExpect(jsonPath("$.data.sentences.total").value(1))
                .andExpect(jsonPath("$.data.vocab.answered").value(0))
                .andExpect(jsonPath("$.data.vocab.accuracyPercent").doesNotExist());
    }

    @Test
    void overview_countsALessonAsDoneOnceEverySentenceIsAttemptedInOneMode_AC_TH_01() throws Exception {
        UUID user = users.newUser();
        UUID lesson = lesson(false, "published");
        UUID s1 = sentence(lesson, 0);
        UUID s2 = sentence(lesson, 1);
        dictation(user, s1, at(1), 80);
        as(user, get(OVERVIEW)).andExpect(jsonPath("$.data.lessons.doing").value(1))
                .andExpect(jsonPath("$.data.lessons.done").value(0));
        dictation(user, s2, at(1), 80);
        as(user, get(OVERVIEW)).andExpect(jsonPath("$.data.lessons.doing").value(0))
                .andExpect(jsonPath("$.data.lessons.done").value(1));
    }

    @Test
    void streak_keepsYesterdaysRunUntilAFullDayIsMissed_andKeepsTheRecord_AC_TH_02() throws Exception {
        UUID user = users.newUser();
        UUID s = sentence(lesson(false, "published"), 0);
        for (int ago = 1; ago <= 4; ago++) {          // 4 ngày liền đến hết hôm qua
            dictation(user, s, at(ago), 80);
        }
        for (int ago = 20; ago <= 31; ago++) {        // kỷ lục cũ 12 ngày
            dictation(user, s, at(ago), 80);
        }

        as(user, get(OVERVIEW)).andExpect(jsonPath("$.data.streak.current").value(4))
                .andExpect(jsonPath("$.data.streak.longest").value(12))
                .andExpect(jsonPath("$.data.streak.studiedToday").value(false));

        dictation(user, s, at(0), 80);                // hôm nay có học thì chuỗi tăng lên 5
        LocalDate today = LocalDate.now(ZONE);
        as(user, get(OVERVIEW)).andExpect(jsonPath("$.data.streak.current").value(5))
                .andExpect(jsonPath("$.data.streak.studiedToday").value(true))
                .andExpect(jsonPath("$.data.streak.todayIndex").value(today.getDayOfWeek().getValue() - 1))
                .andExpect(jsonPath("$.data.streak.week.length()").value(7))
                .andExpect(jsonPath("$.data.streak.week[" + (today.getDayOfWeek().getValue() - 1) + "]").value(true));

        UUID lapsed = users.newUser();                // bỏ trống trọn hôm qua: chuỗi về 0, kỷ lục còn
        for (int ago = 3; ago <= 6; ago++) {
            dictation(lapsed, s, at(ago), 80);
        }
        as(lapsed, get(OVERVIEW)).andExpect(jsonPath("$.data.streak.current").value(0))
                .andExpect(jsonPath("$.data.streak.longest").value(4));
    }

    @Test
    void streakEndpoint_returnsTheSameStreakAsTheOverview_AC_TH_02() throws Exception {
        UUID user = users.newUser();
        UUID s = sentence(lesson(false, "published"), 0);
        for (int ago = 1; ago <= 3; ago++) {
            dictation(user, s, at(ago), 80);
        }

        as(user, get("/api/v1/stats/streak")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.current").value(3))
                .andExpect(jsonPath("$.data.longest").value(3))
                .andExpect(jsonPath("$.data.studiedToday").value(false))
                .andExpect(jsonPath("$.data.week.length()").value(7));
        mockMvc.perform(get("/api/v1/stats/streak")).andExpect(status().isUnauthorized());
    }

    @Test
    void streak_countsGiveUpsRetriesVocabAnswersAndCompletedAiSessions_butNotUnfinishedAiOnes_AC_TH_23() throws Exception {
        UUID lesson = lesson(false, "published");
        UUID s = sentence(lesson, 0);

        UUID gaveUp = users.newUser();
        attempts.insertAttempt(gaveUp, s, "dictation", "normal", false, true, at(0));
        as(gaveUp, get(OVERVIEW)).andExpect(jsonPath("$.data.streak.current").value(1))
                .andExpect(jsonPath("$.data.streak.studiedToday").value(true));

        UUID retried = users.newUser();
        attempts.insertAttempt(retried, s, "dictation", "normal", true, false, at(0));
        as(retried, get(OVERVIEW)).andExpect(jsonPath("$.data.streak.studiedToday").value(true));

        UUID cardUser = users.newUser();
        List<UUID> cards = vocab.fill(vocab.deck(base + "streak", false), 1, 1, base + "s");
        reviewLog(cardUser, cards.get(0), null, false, at(0));
        as(cardUser, get(OVERVIEW)).andExpect(jsonPath("$.data.streak.studiedToday").value(true));

        UUID aiDone = users.newUser();
        aiSession(aiDone, lesson, "completed", at(0), 2);
        as(aiDone, get(OVERVIEW)).andExpect(jsonPath("$.data.streak.studiedToday").value(true));

        UUID aiUnfinished = users.newUser();
        aiSession(aiUnfinished, lesson, "active", at(0), 1);
        as(aiUnfinished, get(OVERVIEW)).andExpect(jsonPath("$.data.streak.current").value(0))
                .andExpect(jsonPath("$.data.streak.studiedToday").value(false));

        // hôm qua đã học, hôm nay chưa: chuỗi vẫn giữ và chưa đánh dấu hôm nay (AC-TH-23)
        UUID yesterdayOnly = users.newUser();
        dictation(yesterdayOnly, s, at(1), 80);
        as(yesterdayOnly, get(OVERVIEW)).andExpect(jsonPath("$.data.streak.current").value(1))
                .andExpect(jsonPath("$.data.streak.studiedToday").value(false));
    }

    @Test
    void range_filtersActivityByCalendarDays_andRejectsOtherValues_AC_TH_03() throws Exception {
        UUID user = users.newUser();
        UUID lesson = lesson(false, "published");
        dictation(user, sentence(lesson, 0), at(6), 80);    // vẫn trong 7 ngày (hôm nay và 6 ngày trước)
        dictation(user, sentence(lesson, 1), at(7), 80);    // ngày thứ 8: ngoài 7 ngày
        dictation(user, sentence(lesson, 2), at(29), 80);   // vẫn trong 30 ngày
        dictation(user, sentence(lesson, 3), at(30), 80);   // chỉ ở Toàn bộ

        as(user, get(OVERVIEW).param("range", "7d")).andExpect(jsonPath("$.data.range").value("7d"))
                .andExpect(jsonPath("$.data.sentences.total").value(1));
        as(user, get(OVERVIEW).param("range", "30d")).andExpect(jsonPath("$.data.sentences.total").value(3));
        as(user, get(OVERVIEW).param("range", "all")).andExpect(jsonPath("$.data.sentences.total").value(4));
        as(user, get(OVERVIEW)).andExpect(jsonPath("$.data.sentences.total").value(3));
        as(user, get(OVERVIEW).param("range", "1d")).andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value("VALIDATION_FAILED"));
        as(user, get("/api/v1/stats/dictation-errors").param("range", "week")).andExpect(status().isBadRequest());
        as(user, get(PRONUNCIATION).param("range", "week")).andExpect(status().isBadRequest());
        as(user, get(HISTORY).param("range", "week")).andExpect(status().isBadRequest());
    }

    @Test
    void dictationErrors_countFirstSubmissionsOnly_withCausesAndLastWrongWord_AC_TH_04() throws Exception {
        UUID user = users.newUser();
        UUID lesson = lesson(false, "published");
        UUID s = sentence(lesson, 0);
        long first = attempts.insertAttempt(user, s, "dictation", "normal", false, false, at(3));
        String[] outcomes = {"correct", "omitted", "correct", "omitted", "correct", "substituted", "correct",
                "misspelled", "correct", "correct"};
        for (int i = 0; i < outcomes.length; i++) {
            attempts.insertWord(first, i, "w" + i, "correct".equals(outcomes[i]) ? "w" + i : null, outcomes[i], "function");
        }
        long redo = attempts.insertAttempt(user, s, "dictation", "normal", true, false, at(1));  // làm lại: không tính
        for (int i = 0; i < 10; i++) {
            attempts.insertWord(redo, i, "w" + i, "w" + i, "correct", "function");
        }

        as(user, get("/api/v1/stats/dictation-errors")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.classes.length()").value(6))
                .andExpect(jsonPath("$.data.classes[0].wordClass").value("function"))
                .andExpect(jsonPath("$.data.classes[0].opportunities").value(10))
                .andExpect(jsonPath("$.data.classes[0].errors").value(4))
                .andExpect(jsonPath("$.data.classes[0].errorPercent").value(40))
                .andExpect(jsonPath("$.data.classes[0].omitted").value(2))
                .andExpect(jsonPath("$.data.classes[0].substituted").value(1))
                .andExpect(jsonPath("$.data.classes[0].misspelled").value(1))
                .andExpect(jsonPath("$.data.classes[0].lastWrongWord").value("w7"))
                .andExpect(jsonPath("$.data.classes[1].wordClass").value("content"))
                .andExpect(jsonPath("$.data.classes[1].opportunities").value(0))
                .andExpect(jsonPath("$.data.classes[1].lastWrongWord").doesNotExist());
    }

    @Test
    void dictationErrors_ignoreGiveUpsAndFollowTheRange_AC_TH_04() throws Exception {
        UUID user = users.newUser();
        UUID lesson = lesson(false, "published");
        UUID old = sentence(lesson, 0);
        long oldAttempt = attempts.insertAttempt(user, old, "dictation", "normal", false, false, at(60));
        attempts.insertWord(oldAttempt, 0, "tree", null, "omitted", "content");
        UUID gaveUp = sentence(lesson, 1);
        long gaveUpAttempt = attempts.insertAttempt(user, gaveUp, "dictation", "normal", false, true, at(1));
        attempts.insertWord(gaveUpAttempt, 0, "river", null, "revealed", "content");

        as(user, get("/api/v1/stats/dictation-errors")).andExpect(jsonPath("$.data.classes[1].opportunities").value(0));
        as(user, get("/api/v1/stats/dictation-errors").param("range", "all"))
                .andExpect(jsonPath("$.data.classes[1].opportunities").value(1))
                .andExpect(jsonPath("$.data.classes[1].errors").value(1))
                .andExpect(jsonPath("$.data.classes[1].lastWrongWord").value("tree"));
    }

    @Test
    void overview_forANewLearner_isAllZeroes_AC_TH_05() throws Exception {
        UUID user = users.newUser();

        as(user, get(OVERVIEW)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.streak.current").value(0))
                .andExpect(jsonPath("$.data.streak.longest").value(0))
                .andExpect(jsonPath("$.data.streak.studiedToday").value(false))
                .andExpect(jsonPath("$.data.sentences.total").value(0))
                .andExpect(jsonPath("$.data.lessons.doing").value(0))
                .andExpect(jsonPath("$.data.lessons.done").value(0))
                .andExpect(jsonPath("$.data.vocab.cards.newCount").value(0))
                .andExpect(jsonPath("$.data.vocab.answered").value(0));
        as(user, get(HISTORY)).andExpect(jsonPath("$.data.totalElements").value(0))
                .andExpect(jsonPath("$.data.items.length()").value(0));
        as(user, get("/api/v1/stats/dictation-errors"))
                .andExpect(jsonPath("$.data.classes[0].opportunities").value(0));
    }

    @Test
    void stats_areOnlyForTheSignedInStudent_AC_TH_06() throws Exception {
        UUID teacher = users.newUser();
        jdbc.update("UPDATE users SET role = 'teacher' WHERE id = ?", teacher);
        String teacherToken = jwtTokenService.issueAccessToken(teacher, Role.TEACHER, UUID.randomUUID()).token();

        for (String path : List.of(OVERVIEW, HISTORY, PRONUNCIATION, "/api/v1/stats/dictation-errors",
                "/api/v1/stats/streak")) {
            mockMvc.perform(get(path)).andExpect(status().isUnauthorized());
            mockMvc.perform(get(path).header(HttpHeaders.AUTHORIZATION, "Bearer " + teacherToken))
                    .andExpect(status().isForbidden());
        }

        UUID first = users.newUser();
        UUID second = users.newUser();
        UUID s = sentence(lesson(false, "published"), 0);
        dictation(first, s, at(1), 80);
        as(second, get(OVERVIEW)).andExpect(jsonPath("$.data.sentences.total").value(0));
        as(second, get(HISTORY)).andExpect(jsonPath("$.data.totalElements").value(0));
    }

    // ---------------------------------------------------------------- UC-TH-02: lịch sử luyện tập

    @Test
    void history_groupsAttemptsIntoPracticeSessions_newestFirst_AC_TH_08() throws Exception {
        UUID user = users.newUser();
        UUID lessonA = lesson(false, "published");
        UUID a1 = sentence(lessonA, 0);
        UUID a2 = sentence(lessonA, 1);
        UUID a3 = sentence(lessonA, 2);
        dictation(user, a1, at(1).plusSeconds(10), 80);
        attempts.setScore(attempts.insertAttempt(user, a1, "dictation", "normal", true, false, at(1).plusSeconds(20)), "100");
        attempts.insertAttempt(user, a2, "dictation", "normal", false, true, at(1).plusSeconds(30));   // bỏ cuộc: 0 điểm
        dictation(user, a2, at(1).plusSeconds(40), 60);
        dictation(user, a3, at(1).plusSeconds(50), 70);

        UUID lessonB = lesson(false, "published");
        shadowing(user, sentence(lessonB, 0), at(0), 85);

        UUID deck = vocab.deck(base + "hist", false);
        UUID card = vocab.fill(deck, 1, 1, base + "h").get(0);
        UUID session = vocabSession(user, deck, at(0).minusSeconds(120));
        reviewLog(user, card, session, true, at(0).minusSeconds(110));
        reviewLog(user, card, session, false, at(0).minusSeconds(100));

        as(user, get(HISTORY)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.items[0].type").value("practice"))
                .andExpect(jsonPath("$.data.items[0].mode").value("shadowing"))
                .andExpect(jsonPath("$.data.items[0].lessonId").value(lessonB.toString()))
                .andExpect(jsonPath("$.data.items[1].type").value("vocab"))
                .andExpect(jsonPath("$.data.items[1].answered").value(2))
                .andExpect(jsonPath("$.data.items[1].correct").value(1))
                .andExpect(jsonPath("$.data.items[1].deckId").value(deck.toString()))
                .andExpect(jsonPath("$.data.items[1].deckKind").value("library"))
                .andExpect(jsonPath("$.data.items[2].type").value("practice"))
                .andExpect(jsonPath("$.data.items[2].mode").value("dictation"))
                .andExpect(jsonPath("$.data.items[2].sentences").value(3))
                // điểm cao nhất mỗi câu: 100, 60, 70; lượt bỏ cuộc 0 điểm không kéo xuống vì câu đó có lượt tốt hơn
                .andExpect(jsonPath("$.data.items[2].averageScore").value(76.7))
                .andExpect(jsonPath("$.data.items[2].retries").value(1))
                .andExpect(jsonPath("$.data.items[2].gaveUps").value(1))
                .andExpect(jsonPath("$.data.items[2].available").value(true));
    }

    @Test
    void history_filtersByModeAndRange_AC_TH_09() throws Exception {
        UUID user = users.newUser();
        UUID lesson = lesson(false, "published");
        shadowing(user, sentence(lesson, 0), at(2), 80);
        shadowing(user, sentence(lesson, 1), at(40), 80);   // ngoài 7 ngày
        dictation(user, sentence(lesson, 2), at(2), 80);
        UUID deck = vocab.deck(base + "flt", false);
        UUID card = vocab.fill(deck, 1, 1, base + "f").get(0);
        reviewLog(user, card, vocabSession(user, deck, at(2)), true, at(2));
        aiSession(user, lesson, "completed", at(2), 1);

        as(user, get(HISTORY).param("mode", "shadowing").param("range", "7d"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].mode").value("shadowing"));
        as(user, get(HISTORY).param("mode", "shadowing").param("range", "all"))
                .andExpect(jsonPath("$.data.totalElements").value(2));
        as(user, get(HISTORY).param("mode", "dictation")).andExpect(jsonPath("$.data.totalElements").value(1));
        as(user, get(HISTORY).param("mode", "vocab")).andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].type").value("vocab"));
        as(user, get(HISTORY).param("mode", "ai")).andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].type").value("ai"))
                .andExpect(jsonPath("$.data.items[0].answered").value(1));
        as(user, get(HISTORY).param("mode", "all")).andExpect(jsonPath("$.data.totalElements").value(4));
        as(user, get(HISTORY).param("mode", "karaoke")).andExpect(status().isBadRequest());
    }

    @Test
    void history_pagesBy20Rows_AC_TH_10() throws Exception {
        UUID user = users.newUser();
        UUID deck = vocab.deck(base + "page", false);
        UUID card = vocab.fill(deck, 1, 1, base + "p").get(0);
        for (int i = 0; i < 25; i++) {
            Instant when = at(1).plusSeconds(i);
            reviewLog(user, card, vocabSession(user, deck, when), true, when);
        }

        as(user, get(HISTORY)).andExpect(jsonPath("$.data.items.length()").value(20))
                .andExpect(jsonPath("$.data.totalElements").value(25))
                .andExpect(jsonPath("$.data.totalPages").value(2))
                .andExpect(jsonPath("$.data.size").value(20));
        as(user, get(HISTORY).param("page", "1")).andExpect(jsonPath("$.data.items.length()").value(5))
                .andExpect(jsonPath("$.data.page").value(1));
        as(user, get(HISTORY).param("page", "2")).andExpect(jsonPath("$.data.items.length()").value(0));
    }

    @Test
    void history_mergesSourcesByTimeAcrossPages_AC_TH_10() throws Exception {
        UUID user = users.newUser();
        UUID lesson = lesson(false, "published");
        UUID deck = vocab.deck(base + "mix", false);
        UUID card = vocab.fill(deck, 1, 1, base + "m").get(0);
        for (int i = 0; i < 12; i++) {                      // 12 phiên từ vựng xen kẽ 12 Buổi luyện của 12 bài
            Instant vocabAt = at(1).plusSeconds(i * 2L);
            reviewLog(user, card, vocabSession(user, deck, vocabAt), true, vocabAt);
            dictation(user, sentence(lesson(false, "published"), 0), at(1).plusSeconds(i * 2L + 1), 80);
        }

        List<String> types = new ArrayList<>();
        for (int page = 0; page < 2; page++) {
            String body = as(user, get(HISTORY).param("page", String.valueOf(page))).andExpect(status().isOk())
                    .andExpect(jsonPath("$.data.totalElements").value(24))
                    .andReturn().getResponse().getContentAsString();
            types.addAll(com.jayway.jsonpath.JsonPath.<List<String>>read(body, "$.data.items[*].type"));
        }
        assertThat(types).hasSize(24);
        // mới nhất là Buổi luyện (giây lẻ), rồi xen kẽ: tổng thứ tự theo thời gian xuyên suốt hai trang
        assertThat(types).containsExactlyElementsOf(java.util.stream.IntStream.range(0, 24)
                .mapToObj(i -> i % 2 == 0 ? "practice" : "vocab").toList());
    }

    @Test
    void history_aPracticeSessionOpensIntoItsAttempts_evenWhenTheLessonWasUnpublished_AC_TH_11() throws Exception {
        UUID user = users.newUser();
        UUID lesson = lesson(false, "published");
        UUID s1 = sentence(lesson, 0);
        UUID s2 = sentence(lesson, 1);
        dictation(user, s1, at(1).plusSeconds(10), 80);
        attempts.insertAttempt(user, s1, "dictation", "normal", true, false, at(1).plusSeconds(20));
        attempts.insertAttempt(user, s2, "dictation", "normal", false, true, at(1).plusSeconds(30));
        String day = LocalDate.now(ZONE).minusDays(1).toString();

        as(user, get("/api/v1/stats/history/practice-sessions/{lesson}", lesson)
                .param("mode", "dictation").param("day", day))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.available").value(true))
                .andExpect(jsonPath("$.data.attempts.length()").value(3))
                .andExpect(jsonPath("$.data.attempts[0].kind").value("gave_up"))
                .andExpect(jsonPath("$.data.attempts[0].sentenceId").value(s2.toString()))
                .andExpect(jsonPath("$.data.attempts[1].kind").value("retry"))
                .andExpect(jsonPath("$.data.attempts[2].kind").value("normal"))
                .andExpect(jsonPath("$.data.attempts[2].text").value("sentence 0"));

        jdbc.update("UPDATE lessons SET status = 'draft' WHERE id = ?", lesson);
        as(user, get("/api/v1/stats/history/practice-sessions/{lesson}", lesson)
                .param("mode", "dictation").param("day", day))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.available").value(false))
                .andExpect(jsonPath("$.data.attempts.length()").value(3));
        as(user, get(HISTORY)).andExpect(jsonPath("$.data.items[0].available").value(false));
    }

    @Test
    void history_aPracticeSessionIsNotFoundForOtherLearnersOrOtherDays_AC_TH_24() throws Exception {
        UUID owner = users.newUser();
        UUID other = users.newUser();
        UUID lesson = lesson(false, "published");
        dictation(owner, sentence(lesson, 0), at(1), 80);
        String day = LocalDate.now(ZONE).minusDays(1).toString();

        as(other, get("/api/v1/stats/history/practice-sessions/{lesson}", lesson)
                .param("mode", "dictation").param("day", day)).andExpect(status().isNotFound());
        as(owner, get("/api/v1/stats/history/practice-sessions/{lesson}", lesson)
                .param("mode", "dictation").param("day", LocalDate.now(ZONE).minusDays(5).toString()))
                .andExpect(status().isNotFound());
        as(owner, get("/api/v1/stats/history/practice-sessions/{lesson}", lesson)
                .param("mode", "shadowing").param("day", day)).andExpect(status().isNotFound());
        as(owner, get("/api/v1/stats/history/practice-sessions/{lesson}", lesson)
                .param("mode", "karaoke").param("day", day)).andExpect(status().isBadRequest());
    }

    @Test
    void history_showsOnlyFinishedAiSessions_andAnEmptyFilterIsEmpty_AC_TH_12() throws Exception {
        UUID user = users.newUser();
        UUID lesson = lesson(false, "published");
        aiSession(user, lesson, "active", at(1), 1);
        aiSession(user, lesson, "error", at(1), 1);

        as(user, get(HISTORY).param("mode", "ai").param("range", "7d")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(0))
                .andExpect(jsonPath("$.data.items.length()").value(0));

        aiSession(user, lesson, "completed", at(1), 3);
        as(user, get(HISTORY).param("mode", "ai").param("range", "7d"))
                .andExpect(jsonPath("$.data.totalElements").value(1))
                .andExpect(jsonPath("$.data.items[0].answered").value(3))
                .andExpect(jsonPath("$.data.items[0].available").value(true));
    }

    // ---------------------------------------------------------------- UC-TH-03: phát âm

    @Test
    void pronunciation_mapsAll44Phonemes_withLevelsFromTheErrorRate_AC_TH_14() throws Exception {
        UUID user = users.newUser();
        UUID s = sentence(lesson(false, "published"), 0);
        shadowing(user, s, at(2), 70, join(
                rep(9, "i:i:90"), rep(1, "i:ɪ:50"),                       // /i/ lỗi 10%
                rep(8, "ɪ:ɪ:90"), rep(2, "ɪ:ɪ:40"),                       // /ɪ/ lỗi 20%
                rep(6, "θ:θ:90"), rep(3, "θ:t:40"), rep(1, "θ:t:90"),      // /θ/ lỗi 40% (có 1 lần bị nghe ra /t/ dù điểm cao)
                rep(3, "ʒ:ʒ:90")));                                        // /ʒ/ mới gặp 3 lần

        as(user, get(PRONUNCIATION)).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.phonemes.length()").value(44))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='i')].level").value("good"))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='i')].errorPercent").value(10))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='ɪ')].level").value("attention"))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='θ')].level").value("bad"))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='ʒ')].level").value("insufficient"))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='ʒ')].total").value(3))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='p')].level").value("insufficient"))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='p')].total").value(0));
    }

    @Test
    void pronunciation_countsErrorsAgainstTheTargetPhonemeAndTheBelow60Threshold_AC_TH_15() throws Exception {
        UUID user = users.newUser();
        UUID s = sentence(lesson(false, "published"), 0);
        shadowing(user, s, at(2), 70, join(rep(6, "θ:θ:60"), rep(4, "θ:θ:59")));   // đúng 60 là chưa lỗi, 59 là lỗi

        as(user, get(PRONUNCIATION)).andExpect(jsonPath("$.data.phonemes[?(@.symbol=='θ')].total").value(10))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='θ')].errors").value(4))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='θ')].errorPercent").value(40));
    }

    @Test
    void pronunciation_followsTheRange_AC_TH_18() throws Exception {
        UUID user = users.newUser();
        UUID s = sentence(lesson(false, "published"), 0);
        shadowing(user, s, at(2), 70, join(rep(6, "θ:θ:90"), rep(4, "θ:θ:40")));
        shadowing(user, s, at(20), 70, rep(10, "θ:θ:40"));
        shadowing(user, s, at(60), 70, rep(10, "θ:θ:40"));

        as(user, get(PRONUNCIATION).param("range", "7d"))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='θ')].total").value(10))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='θ')].errors").value(4));
        as(user, get(PRONUNCIATION).param("range", "30d"))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='θ')].total").value(20))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='θ')].errors").value(14));
        as(user, get(PRONUNCIATION).param("range", "all"))
                .andExpect(jsonPath("$.data.phonemes[?(@.symbol=='θ')].total").value(30));
    }

    @Test
    void pronunciation_averagesShadowingScoresPerDay_orPerWeekForAllTime_AC_TH_18() throws Exception {
        UUID user = users.newUser();
        UUID lesson = lesson(false, "published");
        shadowing(user, sentence(lesson, 0), at(1).plusSeconds(10), 60);
        shadowing(user, sentence(lesson, 1), at(1).plusSeconds(20), 80);
        dictation(user, sentence(lesson, 2), at(1), 10);   // Nghe chép không tính vào điểm phát âm

        as(user, get(PRONUNCIATION).param("range", "7d")).andExpect(jsonPath("$.data.weekly").value(false))
                .andExpect(jsonPath("$.data.scores.length()").value(1))
                .andExpect(jsonPath("$.data.scores[0].averageScore").value(70.0))
                .andExpect(jsonPath("$.data.scores[0].attempts").value(2))
                .andExpect(jsonPath("$.data.scores[0].from").value(LocalDate.now(ZONE).minusDays(1).toString()));
        LocalDate monday = LocalDate.now(ZONE).minusDays(1).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        as(user, get(PRONUNCIATION).param("range", "all")).andExpect(jsonPath("$.data.weekly").value(true))
                .andExpect(jsonPath("$.data.scores[0].from").value(monday.toString()));
    }

    @Test
    void phonemeDetail_showsConfusionTipTrendAndTheLessonToPractice_AC_TH_16() throws Exception {
        UUID user = users.newUser();
        UUID lesson = lesson(false, "published");
        UUID s = sentence(lesson, 0);
        shadowing(user, s, at(2), 70, join(rep(6, "θ:θ:90"), rep(4, "θ:t:40")));

        as(user, get("/api/v1/stats/pronunciation/phoneme").param("symbol", "θ")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cell.symbol").value("θ"))
                .andExpect(jsonPath("$.data.cell.total").value(10))
                .andExpect(jsonPath("$.data.cell.errors").value(4))
                .andExpect(jsonPath("$.data.confusedAs").value("t"))
                .andExpect(jsonPath("$.data.mostlyOmitted").value(false))
                .andExpect(jsonPath("$.data.tip").isNotEmpty())
                .andExpect(jsonPath("$.data.trend.length()").value(8))
                .andExpect(jsonPath("$.data.trend[7].weekStart").value(
                        LocalDate.now(ZONE).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY)).toString()))
                .andExpect(jsonPath("$.data.practiceLessonId").value(lesson.toString()));
    }

    @Test
    void phonemeDetail_trendIsAlwaysTheLast8Weeks_regardlessOfTheRange_AC_TH_16() throws Exception {
        UUID user = users.newUser();
        UUID s = sentence(lesson(false, "published"), 0);
        shadowing(user, s, at(2), 70, join(rep(6, "θ:θ:90"), rep(4, "θ:θ:40")));
        shadowing(user, s, at(30), 70, rep(5, "θ:θ:40"));     // ~4 tuần trước: vẫn nằm trong 8 tuần
        shadowing(user, s, at(100), 70, rep(5, "θ:θ:40"));    // ngoài 8 tuần

        String body = as(user, get("/api/v1/stats/pronunciation/phoneme").param("symbol", "θ").param("range", "7d"))
                .andExpect(jsonPath("$.data.cell.total").value(10))
                .andExpect(jsonPath("$.data.trend.length()").value(8))
                .andReturn().getResponse().getContentAsString();
        List<Integer> totals = com.jayway.jsonpath.JsonPath.read(body, "$.data.trend[*].total");
        assertThat(totals.stream().mapToInt(Integer::intValue).sum()).isEqualTo(15);
    }

    @Test
    void phonemeDetail_whenMostFailuresHearNothing_reportsOmission_AC_TH_16() throws Exception {
        UUID user = users.newUser();
        UUID s = sentence(lesson(false, "published"), 0);
        shadowing(user, s, at(2), 70, join(rep(2, "ð:ð:90"), rep(4, "ð:-:20"), rep(1, "ð:d:30")));

        as(user, get("/api/v1/stats/pronunciation/phoneme").param("symbol", "ð")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.mostlyOmitted").value(true))
                .andExpect(jsonPath("$.data.confusedAs").doesNotExist());
    }

    @Test
    void phonemeDetail_withFewerThan5Encounters_hasNoAnalysis_AC_TH_17() throws Exception {
        UUID user = users.newUser();
        UUID s = sentence(lesson(false, "published"), 0);
        shadowing(user, s, at(2), 70, rep(3, "ʒ:ʒ:30"));

        as(user, get("/api/v1/stats/pronunciation/phoneme").param("symbol", "ʒ")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cell.level").value("insufficient"))
                .andExpect(jsonPath("$.data.cell.total").value(3))
                .andExpect(jsonPath("$.data.cell.errorPercent").doesNotExist())
                .andExpect(jsonPath("$.data.tip").doesNotExist())
                .andExpect(jsonPath("$.data.trend.length()").value(0))
                .andExpect(jsonPath("$.data.practiceLessonId").doesNotExist());
        as(user, get("/api/v1/stats/pronunciation/phoneme").param("symbol", "khong-co"))
                .andExpect(status().isNotFound());
    }

    @Test
    void phonemeDetail_practiceLessonSkipsLockedProLessonsForFreeLearners_AC_TH_25() throws Exception {
        UUID free = users.newUser();
        UUID proUser = users.newProUser();
        UUID olderFree = lesson(false, "published");
        UUID newerPro = lesson(true, "published");
        UUID freeSentence = sentence(olderFree, 0);
        UUID proSentence = sentence(newerPro, 0);
        for (UUID u : List.of(free, proUser)) {
            shadowing(u, freeSentence, at(5), 70, rep(5, "θ:θ:30"));
            shadowing(u, proSentence, at(2), 70, rep(5, "θ:θ:30"));
        }

        as(free, get("/api/v1/stats/pronunciation/phoneme").param("symbol", "θ"))
                .andExpect(jsonPath("$.data.practiceLessonId").value(olderFree.toString()));
        as(proUser, get("/api/v1/stats/pronunciation/phoneme").param("symbol", "θ"))
                .andExpect(jsonPath("$.data.practiceLessonId").value(newerPro.toString()));
    }

    @Test
    void phonemeDetail_withoutAnyOpenLesson_hasNoPracticeLesson_AC_TH_26() throws Exception {
        UUID user = users.newUser();
        UUID gone = lesson(false, "published");
        UUID proOnly = lesson(true, "published");
        shadowing(user, sentence(gone, 0), at(5), 70, rep(5, "θ:θ:30"));
        shadowing(user, sentence(proOnly, 0), at(2), 70, rep(5, "θ:θ:30"));
        jdbc.update("UPDATE lessons SET status = 'draft' WHERE id = ?", gone);

        as(user, get("/api/v1/stats/pronunciation/phoneme").param("symbol", "θ")).andExpect(status().isOk())
                .andExpect(jsonPath("$.data.cell.total").value(10))
                .andExpect(jsonPath("$.data.practiceLessonId").doesNotExist());
    }

    // ---------------------------------------------------------------- dữ liệu mẫu

    private ResultActions as(UUID user, MockHttpServletRequestBuilder request) throws Exception {
        return mockMvc.perform(request.header(HttpHeaders.AUTHORIZATION, "Bearer " + users.tokenFor(user)));
    }

    /** Giữa trưa của ngày lịch cách hôm nay {@code daysAgo} ngày theo múi giờ mặc định, tránh lệch ranh giới ngày. */
    private static Instant at(int daysAgo) {
        return LocalDate.now(ZONE).minusDays(daysAgo).atTime(12, 0).atZone(ZONE).toInstant();
    }

    private UUID lesson(boolean pro, String status) {
        return users.newLesson(base + (seq++), pro, status, false);
    }

    private UUID sentence(UUID lesson, int order) {
        return users.newSentence(lesson, order, "sentence " + order, "câu " + order);
    }

    private long dictation(UUID user, UUID sentence, Instant when, int score) {
        long id = attempts.insertAttempt(user, sentence, "dictation", "normal", false, false, when);
        attempts.setScore(id, String.valueOf(score));
        return id;
    }

    /** Lượt Shadowing kèm các âm vị; mỗi phần tử có dạng {@code đích:nghe-ra:điểm}, nghe ra là {@code -} nếu không nghe ra. */
    private long shadowing(UUID user, UUID sentence, Instant when, int score, String... phonemes) {
        long attempt = attempts.insertAttempt(user, sentence, "shadowing", null, false, false, when);
        attempts.setScore(attempt, String.valueOf(score));
        if (phonemes.length > 0) {
            Long word = jdbc.queryForObject("""
                    INSERT INTO sentence_attempt_words (attempt_id, position, expected_word, outcome, word_class, accuracy_score)
                    VALUES (?, 0, 'word', 'correct', 'content', 80) RETURNING id""", Long.class, attempt);
            for (int i = 0; i < phonemes.length; i++) {
                String[] p = phonemes[i].split(":");
                jdbc.update("""
                        INSERT INTO sentence_attempt_phonemes (attempt_word_id, position, azure_symbol, target_phoneme_id,
                                                               heard_phoneme_id, accuracy_score)
                        VALUES (?, ?, ?, (SELECT id FROM phonemes WHERE symbol = ?),
                                (SELECT id FROM phonemes WHERE symbol = ?), ?)""",
                        word, i, p[0], p[0], "-".equals(p[1]) ? null : p[1], Integer.parseInt(p[2]));
            }
        }
        return attempt;
    }

    private static String[] rep(int times, String spec) {
        String[] out = new String[times];
        Arrays.fill(out, spec);
        return out;
    }

    private static String[] join(String[]... parts) {
        List<String> all = new ArrayList<>();
        for (String[] part : parts) {
            all.addAll(Arrays.asList(part));
        }
        return all.toArray(String[]::new);
    }

    private UUID vocabSession(UUID user, UUID deck, Instant startedAt) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO vocab_sessions (id, user_id, deck_id, kind, started_at) VALUES (?, ?, ?, 'review', ?)",
                id, user, deck, Timestamp.from(startedAt));
        return id;
    }

    private void reviewLog(UUID user, UUID card, UUID session, boolean correct, Instant when) {
        jdbc.update("""
                INSERT INTO vocab_review_logs (user_id, card_id, session_id, mode, is_correct, quality, client_request_id,
                                               created_at)
                VALUES (?, ?, ?, 'flashcard', ?, ?, ?, ?)""",
                user, card, session, correct, correct ? 4 : 1, UUID.randomUUID(), Timestamp.from(when));
    }

    /** Phiên Thực hành với AI với {@code answered} câu trả lời của học viên. */
    private void aiSession(UUID user, UUID lesson, String status, Instant when, int answered) {
        UUID id = UUID.randomUUID();
        jdbc.update("INSERT INTO ai_conversations (id, user_id, lesson_id, status, started_at, ended_at) "
                + "VALUES (?, ?, ?, ?, ?, ?)", id, user, lesson, status, Timestamp.from(when),
                "active".equals(status) ? null : Timestamp.from(when));
        for (int i = 0; i < answered; i++) {
            jdbc.update("INSERT INTO ai_conversation_messages (conversation_id, role, content) VALUES (?, 'student', 'x')", id);
        }
    }
}
