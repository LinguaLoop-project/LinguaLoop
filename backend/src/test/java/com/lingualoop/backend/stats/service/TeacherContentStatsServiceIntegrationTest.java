package com.lingualoop.backend.stats.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.cache.CacheManager;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

import com.lingualoop.backend.TestcontainersConfiguration;
import com.lingualoop.backend.common.exception.BusinessException;
import com.lingualoop.backend.common.exception.ErrorCode;
import com.lingualoop.backend.stats.dto.StatsPeriod;
import com.lingualoop.backend.stats.dto.TeacherDeckStatsView;
import com.lingualoop.backend.stats.dto.TeacherLessonStatsView;
import com.lingualoop.backend.stats.dto.TeacherOverviewView;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;

/**
 * Thống kê nội dung của giáo viên trên Postgres thật (UC-TN-01 đến 03). Mỗi test tạo giáo viên riêng và dừng đồng hồ ở
 * một ngày tương lai riêng nên không lẫn dữ liệu của test khác.
 */
@SpringBootTest
@Import({ TestcontainersConfiguration.class, TestClockConfiguration.class })
class TeacherContentStatsServiceIntegrationTest {

    private static final Instant OLD = Instant.parse("2025-01-01T00:00:00Z");

    @Autowired private TeacherContentStatsService stats;
    @Autowired private MutableClock clock;
    @Autowired private CacheManager cacheManager;
    @Autowired private JdbcTemplate jdbc;

    @BeforeEach
    void clearCaches() {
        cacheManager.getCacheNames().forEach(name -> cacheManager.getCache(name).clear());
    }

    @AfterEach
    void resetClock() {
        clock.reset();
    }

    // ---------------------------------------------------------------- UC-TN-01

    @Test
    void overview_countsOwnContentAndComparesWithPreviousPeriod_AC_TN_01() {
        clock.fixAt(Instant.parse("2033-03-16T05:00:00Z"));
        UUID a = user("teacher");
        UUID b = user("teacher");
        List<UUID> s = lesson(a, "published", 1);
        lesson(a, "draft", 1);
        deck(a, "published");
        deck(a, "draft");
        deck(a, "draft");
        lesson(b, "published", 1);
        UUID student = user("student");
        for (int i = 0; i < 3; i++) {
            attempt(student, s.get(0), "dictation", 80, Instant.parse("2033-03-15T03:00:00Z"));
        }
        for (int i = 0; i < 2; i++) {
            attempt(student, s.get(0), "dictation", 80, Instant.parse("2033-02-01T03:00:00Z"));
        }
        attempt(a, s.get(0), "dictation", 100, Instant.parse("2033-03-15T03:00:00Z")); // giáo viên xem thử

        TeacherOverviewView view = stats.overview(a, StatsPeriod.D30);

        assertThat(view.content()).isEqualTo(new TeacherOverviewView.ContentCounts(1, 1, 1, 2));
        assertThat(view.practiceAttempts().current()).isEqualByComparingTo("3");
        assertThat(view.practiceAttempts().previous()).isEqualByComparingTo("2");
        assertThat(view.practiceAttempts().changePct()).isEqualByComparingTo("50.0");
        assertThat(view.computedAt()).isEqualTo(Instant.parse("2033-03-16T05:00:00Z"));
        assertThat(view.topLessons()).singleElement().satisfies(l -> assertThat(l.attempts()).isEqualTo(3));
        // lượt xem thử của giáo viên không tính học viên
        assertThat(view.learners()).isEqualTo(1);
        assertThat(view.daily().days()).hasSize(30);
        assertThat(view.daily().series().get(TeacherOverviewView.SERIES_DICTATION)).contains(3L);
    }

    @Test
    void overview_periodLimitsAttempts_AC_TN_02() {
        clock.fixAt(Instant.parse("2033-04-16T05:00:00Z"));
        UUID teacher = user("teacher");
        List<UUID> s = lesson(teacher, "published", 1);
        UUID student = user("student");
        attempt(student, s.get(0), "dictation", 80, Instant.parse("2033-04-15T03:00:00Z"));
        attempt(student, s.get(0), "dictation", 80, Instant.parse("2033-04-01T03:00:00Z"));

        assertThat(stats.overview(teacher, StatsPeriod.D7).practiceAttempts().current()).isEqualByComparingTo("1");
        assertThat(stats.overview(teacher, StatsPeriod.D30).practiceAttempts().current()).isEqualByComparingTo("2");
    }

    @Test
    void overview_topLessonsAreFiveWithMostLearners_AC_TN_03() {
        clock.fixAt(Instant.parse("2033-05-16T05:00:00Z"));
        Instant now = Instant.parse("2033-05-15T03:00:00Z");
        UUID teacher = user("teacher");
        UUID busy = user("student");
        for (int lesson = 1; lesson <= 7; lesson++) {
            UUID sentence = lesson(teacher, "published", 1).get(0);
            for (int i = 0; i < lesson; i++) {
                attempt(user("student"), sentence, "dictation", 80, now);
            }
            if (lesson == 1) {
                for (int i = 0; i < 50; i++) {
                    attempt(busy, sentence, "dictation", 80, now); // nhiều lượt nhưng ít học viên
                }
            }
        }

        TeacherOverviewView view = stats.overview(teacher, StatsPeriod.D30);

        assertThat(view.topLessons()).hasSize(5).extracting(TeacherOverviewView.TopLesson::learners)
                .containsExactly(7L, 6L, 5L, 4L, 3L);
    }

    @Test
    void overview_learnersCountLessonOrDeckOnceAndTopDecks_BR_TN_02() {
        clock.fixAt(Instant.parse("2033-06-16T05:00:00Z"));
        Instant now = Instant.parse("2033-06-15T03:00:00Z");
        UUID teacher = user("teacher");
        UUID card = card(group(deck(teacher, "published"), "G"), "apple");
        UUID sentence = lesson(teacher, "published", 1).get(0);
        UUID both = user("student");
        attempt(both, sentence, "dictation", 80, now);
        for (int i = 0; i < 4; i++) {
            review(i == 0 ? both : user("student"), card, i < 3, now);
        }

        TeacherOverviewView view = stats.overview(teacher, StatsPeriod.D30);

        // học viên vừa luyện bài vừa ôn bộ chỉ tính một lần
        assertThat(view.learners()).isEqualTo(4);
        assertThat(view.daily().series().get(TeacherOverviewView.SERIES_REVIEW)).contains(4L);
        assertThat(view.topDecks()).singleElement().satisfies(d -> {
            assertThat(d.learners()).isEqualTo(4);
            assertThat(d.correctRatePct()).isEqualByComparingTo("75.0");
        });
    }

    @Test
    void overview_noContent_AC_TN_06() {
        clock.fixAt(Instant.parse("2033-07-16T05:00:00Z"));

        TeacherOverviewView view = stats.overview(user("teacher"), StatsPeriod.D30);

        assertThat(view.content().isEmpty()).isTrue();
        assertThat(view.topLessons()).isEmpty();
    }

    @Test
    void overview_noAttemptsInPeriod_isZeroWithEmptyRankings_AC_TN_07() {
        clock.fixAt(Instant.parse("2033-08-16T05:00:00Z"));
        UUID teacher = user("teacher");
        List<UUID> s = lesson(teacher, "published", 1);
        attempt(user("student"), s.get(0), "dictation", 80, Instant.parse("2033-07-01T03:00:00Z"));

        TeacherOverviewView view = stats.overview(teacher, StatsPeriod.D7);

        assertThat(view.practiceAttempts().current()).isEqualByComparingTo("0");
        assertThat(view.topLessons()).isEmpty();
        assertThat(view.topDecks()).isEmpty();
        assertThat(view.learners()).isZero();
        assertThat(view.daily().series().values()).allSatisfy(values -> assertThat(values).containsOnly(0L));
    }

    @Test
    void overview_cachedForAnHourButOpenReportsAreLive_BR_TN_06() {
        clock.fixAt(Instant.parse("2033-09-16T05:00:00Z"));
        UUID teacher = user("teacher");
        List<UUID> s = lesson(teacher, "published", 1);
        TeacherOverviewView first = stats.overview(teacher, StatsPeriod.D30);
        attempt(user("student"), s.get(0), "dictation", 80, Instant.parse("2033-09-15T03:00:00Z"));
        report(user("student"), s.get(0));
        clock.fixAt(Instant.parse("2033-09-16T05:30:00Z"));

        TeacherOverviewView cached = stats.overview(teacher, StatsPeriod.D30);

        assertThat(cached.computedAt()).isEqualTo(first.computedAt());
        assertThat(cached.practiceAttempts().current()).isEqualByComparingTo("0");
        assertThat(cached.openReports()).isEqualTo(1);
    }

    // ---------------------------------------------------------------- UC-TN-02

    @Test
    void lesson_countsStartedCompletedOncePerLearnerAndAverages_AC_TN_09() {
        clock.fixAt(Instant.parse("2034-03-16T05:00:00Z"));
        Instant now = Instant.parse("2034-03-15T03:00:00Z");
        UUID teacher = user("teacher");
        List<UUID> s = lesson(teacher, "published", 2);
        UUID lessonId = lessonOf(s.get(0));
        UUID both = user("student");
        UUID dictationOnly = user("student");
        UUID started = user("student");
        for (UUID sentence : s) {
            attempt(both, sentence, "dictation", 80, now);
            attempt(both, sentence, "shadowing", 60, now);
            attempt(dictationOnly, sentence, "dictation", 60, now);
        }
        attempt(started, s.get(0), "shadowing", 90, now);

        TeacherLessonStatsView view = stats.lesson(teacher, lessonId, StatsPeriod.D30);

        assertThat(view.learnersStarted()).isEqualTo(3);
        // học viên xong cả hai chế độ chỉ tính một lần
        assertThat(view.learnersCompleted()).isEqualTo(2);
        assertThat(view.completionRatePct()).isEqualByComparingTo("66.7");
        assertThat(view.dictationAttempts()).isEqualTo(4);
        assertThat(view.shadowingAttempts()).isEqualTo(3);
        assertThat(view.dictationAvgScore()).isEqualByComparingTo("70.0");
        assertThat(view.shadowingAvgScore()).isEqualByComparingTo("70.0");
        assertThat(view.daily().series().get(TeacherLessonStatsView.SERIES_DICTATION)).contains(4L);
        // chưa câu nào đủ 10 lượt ở một chế độ
        assertThat(view.hardestDictation()).isEmpty();
        assertThat(view.hardestShadowing()).isEmpty();
    }

    @Test
    void lesson_hardestSentencesPerModeSkipTooFewAttempts_AC_TN_11() {
        clock.fixAt(Instant.parse("2034-04-16T05:00:00Z"));
        Instant now = Instant.parse("2034-04-15T03:00:00Z");
        UUID teacher = user("teacher");
        List<UUID> s = lesson(teacher, "published", 3);
        UUID student = user("student");
        for (int i = 0; i < 10; i++) {
            attempt(student, s.get(0), "dictation", 90, now);
            attempt(student, s.get(0), "shadowing", 70, now);
            attempt(student, s.get(1), "dictation", 40, now);
        }
        for (int i = 0; i < 4; i++) {
            attempt(student, s.get(1), "shadowing", 20, now); // điểm thấp nhưng chưa đủ 10 lượt shadowing
        }
        attempt(student, s.get(2), "dictation", 10, now);

        TeacherLessonStatsView view = stats.lesson(teacher, lessonOf(s.get(0)), StatsPeriod.D30);

        assertThat(view.hardestDictation()).extracting(TeacherLessonStatsView.HardSentence::order)
                .containsExactly(2, 1);
        assertThat(view.hardestDictation().get(0).avgScore()).isEqualByComparingTo("40.0");
        assertThat(view.hardestDictation().get(0).attempts()).isEqualTo(10);
        assertThat(view.hardestShadowing()).extracting(TeacherLessonStatsView.HardSentence::id)
                .containsExactly(s.get(0));
    }

    @Test
    void lesson_hardestSentencesAreFiveTiesKeepLessonOrder_BR_TN_04() {
        clock.fixAt(Instant.parse("2034-06-16T05:00:00Z"));
        Instant now = Instant.parse("2034-06-15T03:00:00Z");
        UUID teacher = user("teacher");
        List<UUID> s = lesson(teacher, "published", 7);
        UUID student = user("student");
        for (int n = 0; n < 7; n++) {
            for (int i = 0; i < 10; i++) {
                attempt(student, s.get(n), "dictation", n < 2 ? 50 : 90 - n, now);
            }
        }

        TeacherLessonStatsView view = stats.lesson(teacher, lessonOf(s.get(0)), StatsPeriod.D30);

        // câu 1 và 2 cùng 50 điểm giữ thứ tự trong bài; câu 3 (88 điểm) và câu 4 (87 điểm) bị loại
        assertThat(view.hardestDictation()).extracting(TeacherLessonStatsView.HardSentence::order)
                .containsExactly(1, 2, 7, 6, 5);
    }

    @Test
    void lesson_periodLimitsAttempts_AC_TN_10() {
        clock.fixAt(Instant.parse("2034-05-16T05:00:00Z"));
        UUID teacher = user("teacher");
        List<UUID> s = lesson(teacher, "published", 1);
        UUID student = user("student");
        for (int i = 0; i < 10; i++) {
            attempt(student, s.get(0), "dictation", 80, Instant.parse("2034-05-15T03:00:00Z"));
        }
        for (int i = 0; i < 5; i++) {
            attempt(student, s.get(0), "dictation", 20, Instant.parse("2034-05-01T03:00:00Z"));
        }

        TeacherLessonStatsView week = stats.lesson(teacher, lessonOf(s.get(0)), StatsPeriod.D7);
        TeacherLessonStatsView month = stats.lesson(teacher, lessonOf(s.get(0)), StatsPeriod.D30);

        assertThat(week.dictationAttempts()).isEqualTo(10);
        assertThat(week.hardestDictation()).singleElement().satisfies(row -> {
            assertThat(row.attempts()).isEqualTo(10);
            assertThat(row.avgScore()).isEqualByComparingTo("80.0");
        });
        assertThat(week.daily().days()).hasSize(7);
        assertThat(month.hardestDictation()).singleElement().satisfies(row -> assertThat(row.attempts()).isEqualTo(15));
    }

    @Test
    void lesson_ofAnotherTeacher_isForbidden_AC_TN_12() {
        UUID lessonId = lessonOf(lesson(user("teacher"), "published", 1).get(0));

        assertThatThrownBy(() -> stats.lesson(user("teacher"), lessonId, StatsPeriod.D30))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN));
    }

    @Test
    void lesson_deleted_isNotFound_AC_TN_13() {
        UUID teacher = user("teacher");
        UUID lessonId = lessonOf(lesson(teacher, "published", 1).get(0));
        jdbc.update("UPDATE lessons SET deleted_at = now() WHERE id = ?", lessonId);

        assertThatThrownBy(() -> stats.lesson(teacher, lessonId, StatsPeriod.D30))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.LESSON_NOT_FOUND));
        assertThatThrownBy(() -> stats.lesson(teacher, UUID.randomUUID(), StatsPeriod.D30))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.LESSON_NOT_FOUND));
    }

    @Test
    void lesson_draftWithoutLearners_isZeroWithEmptyHardestLists_AC_TN_14() {
        UUID teacher = user("teacher");
        List<UUID> s = lesson(teacher, "draft", 2);

        TeacherLessonStatsView view = stats.lesson(teacher, lessonOf(s.get(0)), StatsPeriod.D30);

        assertThat(view.status()).isEqualTo("draft");
        assertThat(view.learnersStarted()).isZero();
        assertThat(view.completionRatePct()).isNull();
        assertThat(view.dictationAvgScore()).isNull();
        assertThat(view.hardestDictation()).isEmpty();
        assertThat(view.hardestShadowing()).isEmpty();
    }

    // ---------------------------------------------------------------- UC-TN-03

    @Test
    void deck_countsLearnersCorrectRateStatesAndHardestCardsPerGroup_AC_TN_16_AC_TN_19() {
        clock.fixAt(Instant.parse("2035-03-16T05:00:00Z"));
        Instant now = Instant.parse("2035-03-15T03:00:00Z");
        UUID teacher = user("teacher");
        UUID deck = deck(teacher, "published");
        UUID g1 = group(deck, "Môi trường");
        UUID g2 = group(deck, "Công việc");
        UUID c1 = card(g1, "climate");
        UUID c2 = card(g1, "forest");
        UUID c3 = card(g2, "salary");
        UUID x = user("student");
        UUID y = user("student");
        for (int i = 0; i < 10; i++) {
            review(x, c1, i < 9, now);
        }
        review(x, c2, false, now);
        review(y, c1, true, now);
        progress(x, c1, 30, 5); // đã thuộc
        progress(x, c2, 0, 0); // đang học
        progress(y, c1, 6, 2); // đang ôn

        TeacherDeckStatsView view = stats.deck(teacher, deck, StatsPeriod.D30);

        assertThat(view.learners()).isEqualTo(2);
        assertThat(view.reviews()).isEqualTo(12);
        assertThat(view.correctRatePct()).isEqualByComparingTo("83.3");
        // 2 học viên × 3 thẻ = 6 cặp: 1 đã thuộc, 1 đang học, 1 đang ôn, 3 mới
        assertThat(view.cardStates().masteredPct()).isEqualByComparingTo("16.7");
        assertThat(view.cardStates().newPct()).isEqualByComparingTo("50.0");
        assertThat(view.daily().series().get(TeacherDeckStatsView.SERIES_REVIEWS)).contains(12L);
        assertThat(view.daily().series().get(TeacherDeckStatsView.SERIES_CORRECT)).contains(10L);
        assertThat(view.groups()).extracting(TeacherDeckStatsView.GroupRow::name)
                .containsExactly("Môi trường", "Công việc");
        // c1 đủ 11 lượt; c2 (1 lượt) chưa đủ dữ liệu; nhóm "Công việc" không có thẻ nào đủ dữ liệu
        assertThat(view.groups().get(0).hardestCards()).singleElement().satisfies(c -> {
            assertThat(c.id()).isEqualTo(c1);
            assertThat(c.reviews()).isEqualTo(11);
            assertThat(c.correctRatePct()).isEqualByComparingTo("90.9");
        });
        assertThat(view.groups().get(1).hardestCards()).isEmpty();
        assertThat(c2).isNotNull();
        assertThat(c3).isNotNull();
    }

    @Test
    void deck_hardestCardsAreFiveLowestRatePerGroupTiesKeepOrder_AC_TN_18() {
        clock.fixAt(Instant.parse("2035-05-16T05:00:00Z"));
        Instant now = Instant.parse("2035-05-15T03:00:00Z");
        UUID teacher = user("teacher");
        UUID deck = deck(teacher, "published");
        UUID g = group(deck, "Môi trường");
        int[] correct = { 9, 3, 3, 8, 7, 6, 10 };
        List<UUID> cards = new ArrayList<>();
        for (int n = 0; n < correct.length; n++) {
            cards.add(card(g, "word" + n));
        }
        UUID student = user("student");
        for (int n = 0; n < correct.length; n++) {
            for (int i = 0; i < 10; i++) {
                review(student, cards.get(n), i < correct[n], now);
            }
        }

        TeacherDeckStatsView view = stats.deck(teacher, deck, StatsPeriod.D30);

        // 30%, 30% (giữ thứ tự trong nhóm), 60%, 70%, 80%; thẻ 90% và 100% bị loại
        assertThat(view.groups().get(0).hardestCards()).extracting(TeacherDeckStatsView.HardCard::id)
                .containsExactly(cards.get(1), cards.get(2), cards.get(5), cards.get(4), cards.get(3));
        assertThat(view.groups().get(0).hardestCards().get(0).correctRatePct()).isEqualByComparingTo("30.0");
    }

    @Test
    void deck_periodLimitsReviews_AC_TN_17() {
        clock.fixAt(Instant.parse("2035-04-16T05:00:00Z"));
        UUID teacher = user("teacher");
        UUID deck = deck(teacher, "published");
        UUID card = card(group(deck, "G"), "word");
        UUID student = user("student");
        review(student, card, true, Instant.parse("2035-04-15T03:00:00Z"));
        review(student, card, false, Instant.parse("2035-02-01T03:00:00Z"));

        assertThat(stats.deck(teacher, deck, StatsPeriod.D30).reviews()).isEqualTo(1);
        TeacherDeckStatsView quarter = stats.deck(teacher, deck, StatsPeriod.D90);
        assertThat(quarter.reviews()).isEqualTo(2);
        assertThat(quarter.correctRatePct()).isEqualByComparingTo("50.0");
    }

    @Test
    void deck_ofAnotherTeacher_isForbiddenAndDeletedIsNotFound_AC_TN_20_AC_TN_21() {
        UUID owner = user("teacher");
        UUID deck = deck(owner, "published");

        assertThatThrownBy(() -> stats.deck(user("teacher"), deck, StatsPeriod.D30))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.FORBIDDEN));
        jdbc.update("UPDATE vocab_decks SET deleted_at = now() WHERE id = ?", deck);
        assertThatThrownBy(() -> stats.deck(owner, deck, StatsPeriod.D30))
                .isInstanceOfSatisfying(BusinessException.class,
                        e -> assertThat(e.getErrorCode()).isEqualTo(ErrorCode.VOCAB_DECK_NOT_FOUND));
    }

    @Test
    void deck_draftWithoutLearners_isZeroAndGroupsHaveNoHardestCards_AC_TN_22() {
        UUID teacher = user("teacher");
        UUID deck = deck(teacher, "draft");
        card(group(deck, "G"), "word");

        TeacherDeckStatsView view = stats.deck(teacher, deck, StatsPeriod.D30);

        assertThat(view.learners()).isZero();
        assertThat(view.correctRatePct()).isNull();
        assertThat(view.cardStates().newPct()).isNull();
        assertThat(view.groups()).singleElement().satisfies(g -> assertThat(g.hardestCards()).isEmpty());
    }

    // ---------------------------------------------------------------- dữ liệu

    private UUID user(String role) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, display_name, role, created_at)
                VALUES (?, ?, 'hash', ?, ?, ?)""", id, "tn-" + id + "@x.com", "U " + id.toString().substring(0, 6),
                role, Timestamp.from(OLD));
        return id;
    }

    /** Bài thư viện với {@code count} câu không chồng mốc thời gian, trả id các câu theo thứ tự trong bài. */
    private List<UUID> lesson(UUID owner, String status, int count) {
        UUID topic = jdbc.queryForObject("INSERT INTO topics (name) VALUES (?) RETURNING id", UUID.class,
                "tn-" + UUID.randomUUID());
        UUID lesson = jdbc.queryForObject("""
                INSERT INTO lessons (owner_id, kind, topic_id, title, youtube_id, duration_sec, cefr_level, status)
                VALUES (?, 'library', ?, ?, ?, 600, 'B1', ?) RETURNING id""", UUID.class, owner, topic,
                "Bài " + UUID.randomUUID(), UUID.randomUUID().toString().substring(0, 11), status);
        List<UUID> ids = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            ids.add(jdbc.queryForObject("""
                    INSERT INTO sentences (lesson_id, text_en, text_vi, ipa_us, start_ms, end_ms)
                    VALUES (?, ?, 'câu', '/x/', ?, ?) RETURNING id""", UUID.class, lesson, "Sentence " + i,
                    i * 2000, i * 2000 + 2000));
        }
        return ids;
    }

    private UUID lessonOf(UUID sentence) {
        return jdbc.queryForObject("SELECT lesson_id FROM sentences WHERE id = ?", UUID.class, sentence);
    }

    private void attempt(UUID userId, UUID sentence, String mode, int score, Instant at) {
        jdbc.update("""
                INSERT INTO sentence_attempts (user_id, sentence_id, mode, total_score, level, created_at)
                VALUES (?, ?, ?, ?, ?, ?)""", userId, sentence, mode, score,
                "dictation".equals(mode) ? "normal" : null, Timestamp.from(at));
    }

    private UUID deck(UUID owner, String status) {
        return jdbc.queryForObject("""
                INSERT INTO vocab_decks (owner_id, kind, name, status) VALUES (?, 'library', ?, ?)
                RETURNING id""", UUID.class, owner, "Bộ " + UUID.randomUUID(), status);
    }

    private UUID group(UUID deck, String name) {
        return jdbc.queryForObject("INSERT INTO vocab_groups (deck_id, name) VALUES (?, ?) RETURNING id",
                UUID.class, deck, name);
    }

    private UUID card(UUID group, String word) {
        return jdbc.queryForObject("""
                INSERT INTO vocab_cards (deck_id, group_id, word, meaning_vi)
                SELECT deck_id, id, ?, 'nghĩa' FROM vocab_groups WHERE id = ? RETURNING id""", UUID.class, word,
                group);
    }

    private void review(UUID userId, UUID card, boolean correct, Instant at) {
        jdbc.update("""
                INSERT INTO vocab_review_logs (user_id, card_id, mode, is_correct, quality, client_request_id,
                                               created_at)
                VALUES (?, ?, 'flashcard', ?, ?, gen_random_uuid(), ?)""", userId, card, correct, correct ? 4 : 1,
                Timestamp.from(at));
    }

    private void progress(UUID userId, UUID card, int intervalDays, int repetitions) {
        jdbc.update("""
                INSERT INTO user_card_progress (user_id, card_id, interval_days, repetitions, due_at)
                VALUES (?, ?, ?, ?, now())""", userId, card, intervalDays, repetitions);
    }

    private void report(UUID reporter, UUID sentence) {
        jdbc.update("INSERT INTO content_reports (reporter_id, sentence_id, reason) VALUES (?, ?, 'timing')",
                reporter, sentence);
    }
}
