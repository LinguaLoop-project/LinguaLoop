package com.lingualoop.backend.stats.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.LocalDate;
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
import com.lingualoop.backend.stats.dto.AiUsageStatsView;
import com.lingualoop.backend.stats.dto.AiUsageStatsView.FeatureUsage;
import com.lingualoop.backend.stats.dto.OverviewStatsView;
import com.lingualoop.backend.stats.dto.PlanFilter;
import com.lingualoop.backend.stats.dto.PracticeStatsView;
import com.lingualoop.backend.stats.dto.StatsPeriod;
import com.lingualoop.backend.support.MutableClock;
import com.lingualoop.backend.support.TestClockConfiguration;

/**
 * Thống kê hệ thống trên Postgres thật (UC-NK-02 đến 04). Cơ sở dữ liệu dùng chung với mọi test khác, nên mỗi test
 * dừng đồng hồ ở một năm tương lai riêng và chỉ tạo dữ liệu trong năm đó.
 */
@SpringBootTest
@Import({ TestcontainersConfiguration.class, TestClockConfiguration.class })
class SystemStatsAdminServiceIntegrationTest {

    @Autowired private SystemStatsAdminService stats;
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

    // ---------------------------------------------------------------- UC-NK-02

    @Test
    void overview_daysFollowVietnamTimeAndEmptyDaysAreZero_AC_NK_15() {
        clock.fixAt(Instant.parse("2032-03-16T05:00:00Z"));
        user("student", Instant.parse("2032-03-10T16:30:00Z")); // 23:30 ngày 10/3 giờ Việt Nam
        user("student", Instant.parse("2032-03-10T23:30:00Z")); // 06:30 ngày 11/3 giờ Việt Nam

        OverviewStatsView view = stats.overview(StatsPeriod.D7);

        assertThat(view.daily().days()).hasSize(7).first().isEqualTo(LocalDate.of(2032, 3, 10));
        assertThat(view.daily().series().get(OverviewStatsView.SERIES_NEW_ACCOUNTS))
                .containsExactly(1L, 1L, 0L, 0L, 0L, 0L, 0L);
        assertThat(view.newAccounts().current()).isEqualByComparingTo("2");
        assertThat(view.computedAt()).isEqualTo(Instant.parse("2032-03-16T05:00:00Z"));
    }

    @Test
    void overview_activeUserHasPracticeReviewOrSuccessfulAi_AC_NK_14() {
        clock.fixAt(Instant.parse("2032-06-16T05:00:00Z"));
        Instant yesterday = Instant.parse("2032-06-15T03:00:00Z");
        Instant old = Instant.parse("2025-01-01T00:00:00Z");
        UUID a = user("student", old);
        UUID b = user("student", old);
        UUID c = user("student", old);
        UUID d = user("student", old);
        List<UUID> sentences = lesson(user("teacher", old), 1);
        attempt(a, sentences.get(0), "dictation", 80, false, false, yesterday);
        review(b, card(), true, yesterday);
        aiLog(c, "shadowing_feedback", "success", 2, 30, yesterday);
        aiLog(d, "shadowing_feedback", "rejected_no_credit", 0, 0, yesterday);

        OverviewStatsView view = stats.overview(StatsPeriod.D7);

        assertThat(view.daily().series().get(OverviewStatsView.SERIES_ACTIVE_USERS))
                .containsExactly(0L, 0L, 0L, 0L, 0L, 3L, 0L);
    }

    @Test
    void overview_cachedForAnHour_BR_NK_10() {
        clock.fixAt(Instant.parse("2032-09-16T05:00:00Z"));
        OverviewStatsView first = stats.overview(StatsPeriod.D30);
        user("student", Instant.parse("2032-09-15T05:00:00Z"));
        clock.fixAt(Instant.parse("2032-09-16T05:30:00Z"));

        OverviewStatsView cached = stats.overview(StatsPeriod.D30);

        assertThat(cached.computedAt()).isEqualTo(first.computedAt());
        assertThat(cached.newAccounts().current()).isEqualByComparingTo(first.newAccounts().current());
    }

    // ---------------------------------------------------------------- UC-NK-03

    @Test
    void practice_countsAttemptsAveragesAndCompletion_AC_NK_20_AC_NK_17() {
        clock.fixAt(Instant.parse("2031-03-16T05:00:00Z"));
        Instant now = Instant.parse("2031-03-15T03:00:00Z");
        Instant previous = Instant.parse("2031-03-05T03:00:00Z");
        Instant old = Instant.parse("2025-01-01T00:00:00Z");
        UUID teacher = user("teacher", old);
        List<UUID> s = lesson(teacher, 2);
        UUID free = user("student", old);
        UUID pro = user("student", old);
        UUID otherFree = user("student", old);
        proOrder(pro, Instant.parse("2031-01-01T00:00:00Z"), Instant.parse("2031-12-31T00:00:00Z"), 50_000);

        attempt(free, s.get(0), "dictation", 70, false, false, previous);
        attempt(free, s.get(0), "dictation", 70, false, false, previous);
        attempt(free, s.get(0), "dictation", 80, false, false, now);
        attempt(free, s.get(1), "dictation", 60, true, false, now.plusSeconds(60));
        attempt(free, s.get(0), "dictation", 0, false, true, now.plusSeconds(120));
        attempt(pro, s.get(0), "shadowing", 90, false, false, now);
        attempt(pro, s.get(1), "shadowing", 70, false, false, now);
        for (int i = 0; i < 3; i++) {
            attempt(otherFree, s.get(0), "shadowing", 50, false, false, now);
        }
        attempt(teacher, s.get(0), "dictation", 100, false, false, now); // giáo viên không tính

        PracticeStatsView all = stats.practice(StatsPeriod.D7, PlanFilter.ALL);
        PracticeStatsView proOnly = stats.practice(StatsPeriod.D7, PlanFilter.PRO);
        PracticeStatsView freeOnly = stats.practice(StatsPeriod.D7, PlanFilter.FREE);

        assertThat(all.dictationAttempts().current()).isEqualByComparingTo("3");
        assertThat(all.dictationAttempts().changePct()).isEqualByComparingTo("50.0");
        assertThat(all.dictationAvgScore().current()).isEqualByComparingTo("70.0");
        assertThat(all.shadowingAttempts().current()).isEqualByComparingTo("5");
        assertThat(all.learners().current()).isEqualByComparingTo("3");
        // học viên Free làm đủ 2 câu ở nghe chép; học viên Pro làm đủ 2 câu ở shadowing
        assertThat(all.lessonsCompleted().current()).isEqualByComparingTo("2");
        // 3 + 2 + 3 lượt của học viên; lượt của giáo viên không tính
        assertThat(all.topLessons()).singleElement().satisfies(item -> assertThat(item.value()).isEqualTo(8));
        assertThat(all.daily().series().get(PracticeStatsView.SERIES_DICTATION)).contains(3L);

        assertThat(proOnly.shadowingAttempts().current()).isEqualByComparingTo("2");
        assertThat(proOnly.dictationAttempts().current()).isEqualByComparingTo("0");
        assertThat(freeOnly.shadowingAttempts().current()).isEqualByComparingTo("3");
        assertThat(freeOnly.dictationAttempts().current()).isEqualByComparingTo("3");
    }

    @Test
    void practice_learnerCompletingBothModesCountsOnce_BR_TN_02() {
        clock.fixAt(Instant.parse("2031-05-16T05:00:00Z"));
        Instant now = Instant.parse("2031-05-15T03:00:00Z");
        Instant old = Instant.parse("2025-01-01T00:00:00Z");
        List<UUID> s = lesson(user("teacher", old), 1);
        UUID student = user("student", old);
        attempt(student, s.get(0), "dictation", 80, false, false, now);
        attempt(student, s.get(0), "shadowing", 80, false, false, now);

        PracticeStatsView view = stats.practice(StatsPeriod.D7, PlanFilter.ALL);

        assertThat(view.lessonsCompleted().current()).isEqualByComparingTo("1");
    }

    @Test
    void practice_reviewsCorrectRateAndTopDeck_AC_NK_16() {
        clock.fixAt(Instant.parse("2031-08-16T05:00:00Z"));
        Instant now = Instant.parse("2031-08-15T03:00:00Z");
        Instant old = Instant.parse("2025-01-01T00:00:00Z");
        UUID card = card();
        for (int i = 0; i < 10; i++) {
            review(user("student", old), card, i < 7, now);
        }

        PracticeStatsView view = stats.practice(StatsPeriod.D30, PlanFilter.ALL);

        assertThat(view.reviews().current()).isEqualByComparingTo("10");
        assertThat(view.correctRatePct().current()).isEqualByComparingTo("70.0");
        assertThat(view.topDecks()).singleElement().satisfies(item -> assertThat(item.value()).isEqualTo(10));
    }

    @Test
    void practice_noData_isZeroWithEmptyRankings_AC_NK_18() {
        clock.fixAt(Instant.parse("2039-01-16T05:00:00Z"));

        PracticeStatsView view = stats.practice(StatsPeriod.D7, PlanFilter.PRO);

        assertThat(view.shadowingAttempts().current()).isEqualByComparingTo("0");
        assertThat(view.dictationAvgScore().current()).isNull();
        assertThat(view.topLessons()).isEmpty();
        assertThat(view.daily().series().get(PracticeStatsView.SERIES_REVIEW)).containsOnly(0L);
    }

    // ---------------------------------------------------------------- UC-NK-04

    @Test
    void aiUsage_profitAndTrialCostWithExtraCost_AC_NK_21_AC_NK_26() {
        jdbc.update("UPDATE ai_settings SET credit_value_vnd = 25, gateway_fee_pct = 3 WHERE id = 1");
        clock.fixAt(Instant.parse("2033-03-31T05:00:00Z"));
        Instant now = Instant.parse("2033-03-20T03:00:00Z");
        Instant old = Instant.parse("2025-01-01T00:00:00Z");
        UUID pro = user("student", old);
        UUID free = user("student", old);
        UUID teacher = user("teacher", old);
        // khoảng 30 ngày gần nhất: 02/03 đến hết 31/03 giờ Việt Nam
        Instant windowStart = Instant.parse("2033-03-01T17:00:00Z");
        proOrder(pro, windowStart, windowStart.plus(Duration.ofDays(30)), 50_000);
        aiLog(pro, "shadowing_feedback", "success", 2, 30, now);
        aiLog(free, "shadowing_feedback", "success", 2, 30, now);
        aiLog(free, "shadowing_feedback", "success", 2, 30, now);
        aiLog(teacher, "shadowing_feedback", "success", 2, 30, now);
        aiLog(free, "shadowing_feedback", "failed", 0, 10, now);
        aiLog(free, "shadowing_feedback", "rejected_no_credit", 0, 0, now);
        aiLog(pro, "shadowing_feedback", "extra_cost", 0, 20, now);

        AiUsageStatsView view = stats.aiUsage(StatsPeriod.D30);
        FeatureUsage f = view.features().stream().filter(x -> x.feature().equals("shadowing_feedback")).findFirst()
                .orElseThrow();

        assertThat(f.uses()).isEqualTo(4);
        assertThat(f.credits()).isEqualTo(8);
        assertThat(f.costVnd()).isEqualByComparingTo("150");
        // 8 credit ÷ 4 lần nhận xét × 25 đồng; chi phí gồm lần lỗi và lượt phát sinh thêm: 150 ÷ 4 = 37,5
        assertThat(f.units()).isEqualTo(4);
        assertThat(f.pricePerUnitVnd()).isEqualByComparingTo("50");
        assertThat(f.costPerUnitVnd()).isEqualByComparingTo("38");
        assertThat(f.loss()).isFalse();
        assertThat(view.features()).hasSize(5);
        assertThat(view.totals().netRevenueVnd()).isEqualByComparingTo("48500");
        assertThat(view.totals().costVnd()).isEqualByComparingTo("150");
        // chi phí dùng thử chỉ gồm học viên Free (2 lần dùng và 1 lần lỗi): 70 ÷ 150
        assertThat(view.totals().trialCostVnd()).isEqualByComparingTo("70");
        assertThat(view.totals().trialCostPct()).isEqualByComparingTo("46.7");
        assertThat(view.totals().grossProfitVnd()).isEqualByComparingTo("48350");
        assertThat(view.topAccounts().get(0).userId()).isEqualTo(free);
        assertThat(view.topAccounts().get(0).plan()).isEqualTo("free");
        assertThat(view.topAccounts().get(0).credits()).isEqualTo(4);
        assertThat(view.topAccounts().get(0).costVnd()).isEqualByComparingTo("70");
    }

    @Test
    void aiUsage_flagsLossWhoeverUsedIt_AC_NK_27() {
        jdbc.update("UPDATE ai_settings SET credit_value_vnd = 25, gateway_fee_pct = 3 WHERE id = 1");
        clock.fixAt(Instant.parse("2036-06-30T05:00:00Z"));
        Instant at = Instant.parse("2036-06-20T03:00:00Z");
        Instant old = Instant.parse("2025-01-01T00:00:00Z");
        UUID free = user("student", old);
        UUID teacher = user("teacher", old);
        for (int cost : new int[] { 4_000, 5_000, 5_100 }) {
            aiLog(free, "lesson_chat", "success", 5, cost, at);
        }
        for (int i = 0; i < 7; i++) {
            aiLog(teacher, "lesson_suggest", "success", 1, 2, at);
        }
        aiLog(teacher, "lesson_suggest", "success", 2, 2, 4, at); // một lần gợi ý 2 câu
        for (int i = 0; i < 5; i++) {
            aiLog(teacher, "lesson_suggest", "failed", 0, 0, at);
        }

        AiUsageStatsView view = stats.aiUsage(StatsPeriod.D30);
        FeatureUsage chat = byFeature(view, "lesson_chat");
        FeatureUsage suggest = byFeature(view, "lesson_suggest");

        assertThat(chat.pricePerUnitVnd()).isEqualByComparingTo("125");
        assertThat(chat.costPerUnitVnd()).isEqualByComparingTo("4700");
        assertThat(chat.loss()).isTrue();
        assertThat(suggest.uses()).isEqualTo(8);
        assertThat(suggest.units()).isEqualTo(9);
        // 9 credit ÷ 9 câu × 25 đồng, không chia cho 8 lần gọi
        assertThat(suggest.pricePerUnitVnd()).isEqualByComparingTo("25");
        assertThat(suggest.costPerUnitVnd()).isEqualByComparingTo("2");
        assertThat(suggest.loss()).isFalse();
        FeatureUsage unused = byFeature(view, "tutor_session");
        assertThat(unused.pricePerUnitVnd()).isNull();
        assertThat(unused.costPerUnitVnd()).isNull();
        assertThat(unused.loss()).isFalse();
        assertThat(view.totals().costVnd()).isEqualByComparingTo("14118");
        assertThat(view.totals().trialCostVnd()).isEqualByComparingTo("14100");
        assertThat(view.totals().trialCostPct()).isEqualByComparingTo("99.9");
    }

    private static FeatureUsage byFeature(AiUsageStatsView view, String feature) {
        return view.features().stream().filter(x -> x.feature().equals(feature)).findFirst().orElseThrow();
    }

    @Test
    void aiUsage_noUsageStillShowsRevenue_AC_NK_24() {
        jdbc.update("UPDATE ai_settings SET credit_value_vnd = 25, gateway_fee_pct = 3 WHERE id = 1");
        clock.fixAt(Instant.parse("2034-03-16T05:00:00Z"));
        Instant windowStart = Instant.parse("2034-03-09T17:00:00Z");
        for (int i = 0; i < 2; i++) {
            proOrder(user("student", Instant.parse("2025-01-01T00:00:00Z")), windowStart,
                    windowStart.plus(Duration.ofDays(30)), 50_000);
        }

        AiUsageStatsView view = stats.aiUsage(StatsPeriod.D7);

        assertThat(view.features()).allSatisfy(f -> assertThat(f.uses()).isZero());
        assertThat(view.topAccounts()).isEmpty();
        assertThat(view.totals().netRevenueVnd()).isEqualByComparingTo("22633");
        assertThat(view.totals().costVnd()).isEqualByComparingTo("0");
        assertThat(view.totals().trialCostPct()).isNull();
        assertThat(view.totals().grossProfitVnd()).isEqualByComparingTo("22633");
    }

    // ---------------------------------------------------------------- dữ liệu mẫu

    private UUID user(String role, Instant createdAt) {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password_hash, display_name, role, created_at)
                VALUES (?, ?, 'hash', ?, ?, ?)""", id, "nk-" + id + "@x.com", "U " + id.toString().substring(0, 6),
                role, Timestamp.from(createdAt));
        return id;
    }

    private void proOrder(UUID userId, Instant startsAt, Instant endsAt, int amount) {
        jdbc.update("""
                INSERT INTO pro_orders (user_id, plan_name, months, credits_per_month, amount_vnd, status, created_at,
                                        expires_at, paid_at, starts_at, ends_at)
                VALUES (?, 'Pro', 1, 1000, ?, 'paid', ?, ?, ?, ?, ?)""", userId, amount, Timestamp.from(startsAt),
                Timestamp.from(startsAt), Timestamp.from(startsAt), Timestamp.from(startsAt),
                Timestamp.from(endsAt));
    }

    /** Bài thư viện đã xuất bản với {@code count} câu không chồng mốc thời gian. */
    private List<UUID> lesson(UUID owner, int count) {
        UUID topic = jdbc.queryForObject("INSERT INTO topics (name) VALUES (?) RETURNING id", UUID.class,
                "nk-" + UUID.randomUUID());
        UUID lesson = jdbc.queryForObject("""
                INSERT INTO lessons (owner_id, kind, topic_id, title, youtube_id, duration_sec, cefr_level, status)
                VALUES (?, 'library', ?, ?, ?, 600, 'B1', 'published') RETURNING id""", UUID.class, owner, topic,
                "Bài " + UUID.randomUUID(), UUID.randomUUID().toString().substring(0, 11));
        List<UUID> ids = new ArrayList<>();
        for (int i = 0; i < count; i++) {
            ids.add(jdbc.queryForObject("""
                    INSERT INTO sentences (lesson_id, text_en, text_vi, ipa_us, start_ms, end_ms)
                    VALUES (?, ?, 'câu', '/x/', ?, ?) RETURNING id""", UUID.class, lesson, "Sentence " + i,
                    i * 2000, i * 2000 + 2000));
        }
        return ids;
    }

    private void attempt(UUID userId, UUID sentence, String mode, int score, boolean retry, boolean gaveUp,
            Instant at) {
        jdbc.update("""
                INSERT INTO sentence_attempts (user_id, sentence_id, mode, total_score, level, is_retry, gave_up,
                                               created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)""", userId, sentence, mode, score,
                "dictation".equals(mode) ? "normal" : null, retry, gaveUp, Timestamp.from(at));
    }

    /** Một thẻ trong bộ thư viện đã xuất bản mới. */
    private UUID card() {
        UUID owner = user("teacher", Instant.parse("2025-01-01T00:00:00Z"));
        UUID deck = jdbc.queryForObject("""
                INSERT INTO vocab_decks (owner_id, kind, name, status) VALUES (?, 'library', ?, 'published')
                RETURNING id""", UUID.class, owner, "Bộ " + UUID.randomUUID());
        UUID group = jdbc.queryForObject("INSERT INTO vocab_groups (deck_id, name) VALUES (?, 'G') RETURNING id",
                UUID.class, deck);
        return jdbc.queryForObject("""
                INSERT INTO vocab_cards (deck_id, group_id, word, meaning_vi) VALUES (?, ?, 'word', 'nghĩa')
                RETURNING id""", UUID.class, deck, group);
    }

    private void review(UUID userId, UUID card, boolean correct, Instant at) {
        jdbc.update("""
                INSERT INTO vocab_review_logs (user_id, card_id, mode, is_correct, quality, client_request_id,
                                               created_at)
                VALUES (?, ?, 'flashcard', ?, ?, gen_random_uuid(), ?)""", userId, card, correct, correct ? 4 : 1,
                Timestamp.from(at));
    }

    private void aiLog(UUID userId, String feature, String status, int credits, int cost, Instant at) {
        aiLog(userId, feature, status, 1, credits, cost, at);
    }

    private void aiLog(UUID userId, String feature, String status, int quantity, int credits, int cost, Instant at) {
        jdbc.update("""
                INSERT INTO ai_usage_logs (user_id, feature, status, quantity, credits_charged, cost_vnd, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)""", userId, feature, status, quantity, credits, cost,
                Timestamp.from(at));
    }
}
