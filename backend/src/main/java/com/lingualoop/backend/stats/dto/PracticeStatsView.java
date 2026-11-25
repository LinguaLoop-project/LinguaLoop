package com.lingualoop.backend.stats.dto;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/** Thống kê luyện tập toàn hệ thống (UC-NK-03), tính theo gói tại thời điểm luyện (BR-NK-12). */
public record PracticeStatsView(
        Instant computedAt,
        StatsPeriod period,
        PlanFilter plan,
        Metric learners,
        Metric dictationAttempts,
        Metric shadowingAttempts,
        Metric reviews,
        Metric lessonsCompleted,
        Metric dictationAvgScore,
        Metric shadowingAvgScore,
        Metric correctRatePct,
        DailySeries daily,
        List<RankedItem> topLessons,
        List<RankedItem> topDecks) {

    public static final String SERIES_DICTATION = "dictation";
    public static final String SERIES_SHADOWING = "shadowing";
    public static final String SERIES_REVIEW = "review";

    public PracticeStatsView {
        topLessons = List.copyOf(topLessons);
        topDecks = List.copyOf(topDecks);
    }

    /** Một mục xếp hạng: bài học kèm số lượt luyện, hoặc bộ thẻ kèm số học viên; {@code ownerName} là giáo viên chủ. */
    public record RankedItem(UUID id, String name, String ownerName, long value) {
    }
}
