package com.lingualoop.backend.stats.service;

import static com.lingualoop.backend.stats.service.RevenueCalculator.vnd;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;

import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.stats.dto.AiUsageStatsView;
import com.lingualoop.backend.stats.dto.AiUsageStatsView.FeatureUsage;
import com.lingualoop.backend.stats.dto.AiUsageStatsView.TopAccount;
import com.lingualoop.backend.stats.dto.DailySeries;
import com.lingualoop.backend.stats.dto.Metric;
import com.lingualoop.backend.stats.dto.OverviewStatsView;
import com.lingualoop.backend.stats.dto.PlanFilter;
import com.lingualoop.backend.stats.dto.PracticeStatsView;
import com.lingualoop.backend.stats.dto.StatsPeriod;
import com.lingualoop.backend.stats.repository.AiUsageStatsRepository;
import com.lingualoop.backend.stats.repository.AiUsageStatsRepository.FeatureRow;
import com.lingualoop.backend.stats.repository.OverviewStatsRepository;
import com.lingualoop.backend.stats.repository.OverviewStatsRepository.PublishedContent;
import com.lingualoop.backend.stats.repository.SystemPracticeStatsRepository;
import com.lingualoop.backend.stats.repository.RevenueStatsRepository;
import com.lingualoop.backend.stats.repository.RevenueStatsRepository.Settings;
import com.lingualoop.backend.stats.service.RevenueCalculator.Revenue;

import lombok.RequiredArgsConstructor;

/** Ghép số thô từ repository với công thức của calculator; mọi phép tính tỷ lệ, tiền nằm ở calculator. */
@Service
@RequiredArgsConstructor
class SystemStatsAdminServiceImpl implements SystemStatsAdminService {

    static final int PENDING_REPORTS_SHOWN = 3;
    static final int RANKING_SIZE = 5;
    static final int TOP_ACCOUNTS = 10;

    private final OverviewStatsRepository overviewRepository;
    private final SystemPracticeStatsRepository practiceRepository;
    private final AiUsageStatsRepository aiRepository;
    private final RevenueStatsRepository revenueRepository;
    private final Clock clock;

    @Override
    @Transactional(readOnly = true)
    @Cacheable(CACHE_OVERVIEW)
    public OverviewStatsView overview(StatsPeriod period) {
        Instant now = clock.instant();
        StatsWindow w = StatsWindow.of(period, clock);
        Revenue revenue = revenue(w, revenueRepository.settings());
        PublishedContent published = overviewRepository.publishedContent();
        Map<String, Map<LocalDate, Long>> daily = new LinkedHashMap<>();
        daily.put(OverviewStatsView.SERIES_ACTIVE_USERS, overviewRepository.dailyActiveUsers(w.from(), w.to()));
        daily.put(OverviewStatsView.SERIES_NEW_ACCOUNTS, overviewRepository.dailyNewAccounts(w.from(), w.to()));
        return new OverviewStatsView(now, period, overviewRepository.accounts(now),
                Metric.of(overviewRepository.newAccounts(w.from(), w.to()),
                        overviewRepository.newAccounts(w.previousFrom(), w.from())),
                vnd(revenue.recognized()), published.lessons(), published.decks(),
                overviewRepository.pendingAdminReports(),
                overviewRepository.oldestPendingReports(PENDING_REPORTS_SHOWN), DailySeries.of(w.days(), daily));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(CACHE_PRACTICE)
    public PracticeStatsView practice(StatsPeriod period, PlanFilter plan) {
        StatsWindow w = StatsWindow.of(period, clock);
        SystemPracticeStatsRepository.Totals cur = practiceRepository.totals(w.from(), w.to(), plan);
        SystemPracticeStatsRepository.Totals prev = practiceRepository.totals(w.previousFrom(), w.from(), plan);
        Map<String, Map<LocalDate, Long>> raw = practiceRepository.daily(w.from(), w.to(), plan);
        Map<String, Map<LocalDate, Long>> daily = new LinkedHashMap<>();
        daily.put(PracticeStatsView.SERIES_DICTATION, raw.getOrDefault("dictation", Map.of()));
        daily.put(PracticeStatsView.SERIES_SHADOWING, raw.getOrDefault("shadowing", Map.of()));
        daily.put(PracticeStatsView.SERIES_REVIEW, raw.getOrDefault("review", Map.of()));
        return new PracticeStatsView(clock.instant(), period, plan,
                Metric.of(cur.learners(), prev.learners()),
                Metric.of(cur.dictation(), prev.dictation()),
                Metric.of(cur.shadowing(), prev.shadowing()),
                Metric.of(cur.reviews(), prev.reviews()),
                Metric.of(cur.lessonsCompleted(), prev.lessonsCompleted()),
                Metric.of(score(cur.dictationAvg()), score(prev.dictationAvg())),
                Metric.of(score(cur.shadowingAvg()), score(prev.shadowingAvg())),
                Metric.of(pct(cur.correctReviews(), cur.reviews()), pct(prev.correctReviews(), prev.reviews())),
                DailySeries.of(w.days(), daily),
                practiceRepository.topLessons(w.from(), w.to(), plan, RANKING_SIZE),
                practiceRepository.topDecks(w.from(), w.to(), plan, RANKING_SIZE));
    }

    @Override
    @Transactional(readOnly = true)
    @Cacheable(CACHE_AI)
    public AiUsageStatsView aiUsage(StatsPeriod period) {
        Instant now = clock.instant();
        StatsWindow w = StatsWindow.of(period, clock);
        Settings settings = revenueRepository.settings();
        List<FeatureRow> rows = aiRepository.features(w.from(), w.to());
        List<FeatureUsage> features = rows.stream().map(r -> feature(r, settings.creditValueVnd())).toList();

        BigDecimal cost = sum(rows, FeatureRow::cost);
        BigDecimal trialCost = sum(rows, FeatureRow::trialCost);
        BigDecimal net = revenue(w, settings).net();
        BigDecimal grossProfit = RevenueCalculator.grossProfit(net, cost);
        AiUsageStatsView.Totals totals = new AiUsageStatsView.Totals(vnd(net), vnd(cost), vnd(trialCost),
                AiEconomicsCalculator.sharePct(trialCost, cost), vnd(grossProfit),
                RevenueCalculator.grossMarginPct(grossProfit, net));

        Map<String, Map<LocalDate, Long>> raw = aiRepository.dailyCredits(w.from(), w.to());
        Map<String, Map<LocalDate, Long>> daily = new LinkedHashMap<>();
        rows.forEach(r -> daily.put(r.feature(), raw.getOrDefault(r.feature(), Map.of())));

        List<TopAccount> top = aiRepository.topAccounts(w.from(), w.to(), now, TOP_ACCOUNTS).stream()
                .map(a -> new TopAccount(a.userId(), a.name(), a.email(), a.plan(), a.credits(), vnd(a.cost())))
                .toList();
        return new AiUsageStatsView(now, period, settings.creditValueVnd(), features, totals,
                DailySeries.of(w.days(), daily), top);
    }

    private Revenue revenue(StatsWindow w, Settings settings) {
        return RevenueCalculator.revenue(revenueRepository.paidOrders(w.from(), w.to()), w.from(), w.to(),
                settings.gatewayFeePct());
    }

    private static FeatureUsage feature(FeatureRow r, int creditValueVnd) {
        BigDecimal price = AiEconomicsCalculator.pricePerUnit(r.credits(), r.units(), creditValueVnd);
        BigDecimal costPerUnit = AiEconomicsCalculator.costPerUnit(r.cost(), r.units());
        return new FeatureUsage(r.feature(), r.uses(), r.units(), r.credits(), vnd(r.cost()), vnd(price),
                vnd(costPerUnit), AiEconomicsCalculator.isLoss(price, costPerUnit));
    }

    private static BigDecimal sum(List<FeatureRow> rows, Function<FeatureRow, BigDecimal> value) {
        return rows.stream().map(value).reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    /** Điểm trung bình làm tròn 1 chữ số thập phân; trống khi không có lượt nào. */
    private static BigDecimal score(BigDecimal avg) {
        return avg == null ? null : avg.setScale(1, RoundingMode.HALF_UP);
    }

    /** Tỷ lệ phần trăm 1 chữ số thập phân; mẫu bằng 0 thì trống. */
    private static BigDecimal pct(long part, long whole) {
        return whole == 0 ? null
                : BigDecimal.valueOf(part * 100).divide(BigDecimal.valueOf(whole), 1, RoundingMode.HALF_UP);
    }
}
