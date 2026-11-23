package com.lingualoop.backend.shadowing.service;

import java.time.Clock;
import java.time.DayOfWeek;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.temporal.TemporalAdjusters;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.lingualoop.backend.shadowing.dto.PhonemeDetailView;
import com.lingualoop.backend.shadowing.dto.PhonemeStatView;
import com.lingualoop.backend.shadowing.dto.ScorePointView;
import com.lingualoop.backend.shadowing.repository.ShadowingStatsRepository;
import com.lingualoop.backend.shadowing.repository.ShadowingStatsRepository.HeardCount;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
class ShadowingStatsQueryServiceImpl implements ShadowingStatsQueryService {

    private final ShadowingStatsRepository stats;
    private final PhonemeTips tips;
    private final Clock clock;

    @Override
    public List<PhonemeStatView> phonemeMap(UUID userId, Instant since, ZoneId zone) {
        return stats.phonemeMap(userId, dayOf(since, zone));
    }

    @Override
    public List<ScorePointView> scoreTrend(UUID userId, Instant since, boolean weekly) {
        return stats.scoreTrend(userId, since, weekly ? "week" : "day");
    }

    @Override
    public Optional<BigDecimal> averageScore(UUID userId, Instant from, Instant until) {
        return stats.averageScore(userId, from, until);
    }

    @Override
    public Optional<PhonemeDetailView> phonemeDetail(UUID userId, String symbol, Instant since, ZoneId zone) {
        Optional<PhonemeStatView> stat = stats.phonemeStat(userId, symbol, dayOf(since, zone));
        if (stat.isEmpty()) {
            return Optional.empty();
        }
        List<HeardCount> errors = stats.errorsByHeardSymbol(userId, symbol, since);
        // Âm nghe ra khác âm đích nhiều nhất; lỗi do điểm thấp mà âm nghe ra vẫn đúng không phải là "đọc nhầm thành".
        HeardCount confusion = errors.stream()
                .filter(e -> e.heard() != null && !e.heard().equals(symbol))
                .max(java.util.Comparator.comparingLong(HeardCount::count)).orElse(null);
        long omitted = errors.stream().filter(e -> e.heard() == null).mapToLong(HeardCount::count).sum();
        boolean mostlyOmitted = omitted > 0 && (confusion == null || omitted > confusion.count());

        LocalDate thisMonday = LocalDate.now(clock.withZone(zone)).with(TemporalAdjusters.previousOrSame(DayOfWeek.MONDAY));
        List<PhonemeDetailView.WeekPoint> trend = stats.weeklyTrend(userId, symbol,
                thisMonday.minusWeeks(TREND_WEEKS - 1L));
        return Optional.of(new PhonemeDetailView(stat.get(), mostlyOmitted || confusion == null ? null : confusion.heard(),
                mostlyOmitted, tips.tipFor(symbol).orElse(null), trend));
    }

    @Override
    public Optional<UUID> latestOpenLessonWithError(UUID userId, String symbol, boolean pro) {
        return stats.latestOpenLessonWithError(userId, symbol, pro);
    }

    private static LocalDate dayOf(Instant since, ZoneId zone) {
        return since.atZone(zone).toLocalDate();
    }
}
